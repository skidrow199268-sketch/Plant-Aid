// ============================================================
// offlineStore.js
// Local-first data layer for PlantAid's CRUD screens.
//
// Every collection write is applied to a localStorage cache
// first. When the device is online the write is also pushed to
// Firestore immediately. When offline, the write is queued and
// auto-synced to Firestore the moment the browser comes back
// online. Reads always consult the local cache, which is kept
// warm by every successful Firestore query.
// ============================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const PREFIX  = 'plantaid.offline.v1';
let activeUserId = null;

// ─────────────────────────────────────────────────────────────
// Connectivity
// ─────────────────────────────────────────────────────────────

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function isNetworkError(err) {
  if (!err?.code) return !isOnline();
  const c = String(err.code);
  return !isOnline() || /unavailable|network-request-failed|deadline|cancelled|resource-exhausted/.test(c);
}

// ─────────────────────────────────────────────────────────────
// Serialization — Firestore Timestamps <-> plain JSON
// ─────────────────────────────────────────────────────────────

function serializeVal(v) {
  if (v === undefined || v === null) return v;
  if (v instanceof Timestamp || (v && typeof v.toDate === 'function')) {
    return { __ts__: v.toDate().toISOString() };
  }
  if (Array.isArray(v)) return v.map(serializeVal);
  if (typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) {
      const s = serializeVal(v[k]);
      if (s !== undefined) out[k] = s;
    }
    return out;
  }
  return v;
}

function deserializeVal(v) {
  if (v && typeof v === 'object' && !Array.isArray(v) && v.__ts__) {
    return Timestamp.fromDate(new Date(v.__ts__));
  }
  if (Array.isArray(v)) return v.map(deserializeVal);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = deserializeVal(v[k]);
    return out;
  }
  return v;
}

// ─────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────

function storageKey(userId) {
  return `${PREFIX}.${userId}`;
}

function emptyState() {
  return { cache: {}, queue: [] };
}

function load(userId) {
  if (!userId) return emptyState();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      cache: parsed.cache ?? {},
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
    };
  } catch {
    return emptyState();
  }
}

function save(userId, state) {
  if (!userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch (err) {
    console.warn('[offlineStore] localStorage save failed', err);
  }
}

function nextSeq(state) {
  return state.queue.reduce((max, op) => Math.max(max, op.seq), 0) + 1;
}

// ─────────────────────────────────────────────────────────────
// Active user (needed by actions that lack a userId param)
// ─────────────────────────────────────────────────────────────

export function setActiveUserId(uid) {
  activeUserId = uid ?? null;
  if (activeUserId) {
    flushAll().catch(() => {});
  }
}

export function getActiveUserId() {
  return activeUserId;
}

export function getPendingCount(userId) {
  return load(userId).queue.length;
}

// ─────────────────────────────────────────────────────────────
// Cache reads (merged with pending local mutations)
// ─────────────────────────────────────────────────────────────

export function readAll(userId, col) {
  const state = load(userId);
  const colCache = state.cache[col] ?? {};
  return Object.entries(colCache).map(([id, data]) => ({
    id,
    ...deserializeVal(data),
  }));
}

export function readDoc(userId, col, id, fallback = null) {
  const state = load(userId);
  const data = state.cache[col]?.[id];
  return data ? { id, ...deserializeVal(data) } : fallback;
}

// ─────────────────────────────────────────────────────────────
// Cache update from a successful server fetch
// ─────────────────────────────────────────────────────────────

export function upsertServerDocs(userId, col, docs) {
  if (!userId) return;
  const state = load(userId);
  state.cache[col] = state.cache[col] ?? {};
  for (const d of docs) {
    if (d && d.id) state.cache[col][d.id] = serializeVal(d);
  }
  save(userId, state);
}

// Upsert server data into the cache AND fold pending local
// mutations back over it (so queued edits stay visible).
export function upsertAndReapply(userId, col, docs) {
  if (!userId) return;
  const state = load(userId);
  state.cache[col] = state.cache[col] ?? {};
  for (const d of docs) {
    if (d && d.id) state.cache[col][d.id] = serializeVal(d);
  }
  reapplyQueue(userId, state);
  save(userId, state);
}

function reapplyQueue(userId, state) {
  const ops = [...state.queue].sort((a, b) => a.seq - b.seq);
  for (const op of ops) {
    const colCache = state.cache[op.col] ?? (state.cache[op.col] = {});
    if (op.op === 'create') {
      if (!colCache[op.id]) colCache[op.id] = op.data;
    } else if (op.op === 'update') {
      colCache[op.id] = { ...(colCache[op.id] ?? {}), ...op.data };
    } else if (op.op === 'delete') {
      delete colCache[op.id];
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Remote reads (refresh cache when online, then return cache)
// ─────────────────────────────────────────────────────────────

export async function remoteThenLocal(userId, col, fetchRemote) {
  if (userId) {
    if (isOnline()) {
      try {
        const docs = await fetchRemote();
        if (Array.isArray(docs)) {
          upsertServerDocs(userId, col, docs);
          const state = load(userId);
          reapplyQueue(userId, state);
          save(userId, state);
        }
      } catch (err) {
        if (!isNetworkError(err)) console.warn('[offlineStore] refresh failed', err);
      }
    }
  }
  return readAll(userId, col);
}

export async function remoteThenLocalDoc(userId, col, docId, fetchRemote) {
  if (userId) {
    if (isOnline()) {
      try {
        const docData = await fetchRemote();
        if (docData && docData.id) {
          upsertServerDocs(userId, col, [docData]);
          const state = load(userId);
          reapplyQueue(userId, state);
          save(userId, state);
        }
      } catch (err) {
        if (!isNetworkError(err)) console.warn('[offlineStore] refresh failed', err);
      }
    }
  }
  return readDoc(userId, col, docId, null);
}

// ─────────────────────────────────────────────────────────────
// Writes — applied locally, pushed to Firestore when online
// ─────────────────────────────────────────────────────────────

export async function queueCreate(userId, col, data) {
  const state = load(userId);
  const id = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const serialized = serializeVal(data);
  state.cache[col] = state.cache[col] ?? {};
  state.cache[col][id] = serialized;
  state.queue.push({ seq: nextSeq(state), col, op: 'create', id, data: serialized });
  save(userId, state);
  return { id, ...deserializeVal(serialized) };
}

export async function queueUpdate(userId, col, id, patches) {
  if (!userId) return;
  const state = load(userId);
  const serialized = serializeVal(patches);

  const createOp = state.queue.find(
    (op) => op.op === 'create' && op.col === col && op.id === id,
  );
  if (createOp) {
    createOp.data = { ...createOp.data, ...serialized };
  }

  state.cache[col] = state.cache[col] ?? {};
  state.cache[col][id] = { ...(state.cache[col][id] ?? {}), ...serialized };

  if (!createOp) {
    state.queue.push({ seq: nextSeq(state), col, op: 'update', id, data: serialized });
  }
  save(userId, state);
}

export async function queueDelete(userId, col, id) {
  if (!userId) return;
  const state = load(userId);

  const createIdx = state.queue.findIndex(
    (op) => op.op === 'create' && op.col === col && op.id === id,
  );
  if (createIdx !== -1) {
    // Never created on the server yet — cancel the whole bunch locally.
    state.queue = state.queue.filter(
      (op, idx) => idx !== createIdx && !(idx > createIdx && op.col === col && op.id === id),
    );
  } else {
    state.queue.push({ seq: nextSeq(state), col, op: 'delete', id });
  }

  state.cache[col] = state.cache[col] ?? {};
  delete state.cache[col][id];
  save(userId, state);
}

// ─────────────────────────────────────────────────────────────
// Gatekeeper used by services — write online, queue offline
// ─────────────────────────────────────────────────────────────

export async function createDocOnlineFirst(userId, col, data) {
  if (userId && isOnline()) {
    try {
      const ref = await addDoc(collection(db, col), data);
      const created = { id: ref.id, ...data, createdAt: data.createdAt ?? Timestamp.now() };
      upsertServerDocs(userId, col, [created]);
      const state = load(userId);
      reapplyQueue(userId, state);
      save(userId, state);
      return created;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }
  return queueCreate(userId, col, data);
}

export async function updateDocOnlineFirst(userId, col, id, patches) {
  if (!userId) return;
  const state0 = load(userId);
  const createOp = state0.queue.find(
    (op) => op.op === 'create' && op.col === col && op.id === id,
  );
  if (createOp) {
    // Still pending creation — fold the edit into the queued create.
    createOp.data = { ...createOp.data, ...serializeVal(patches) };
    state0.cache[col] = state0.cache[col] ?? {};
    state0.cache[col][id] = { ...(state0.cache[col][id] ?? {}), ...serializeVal(patches) };
    save(userId, state0);
    return;
  }

  if (isOnline()) {
    try {
      await updateDoc(doc(db, col, id), patches);
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      await queueUpdate(userId, col, id, patches);
      return;
    }
    // Success — mirror to cache, no queue op needed (server already has it).
    const state = load(userId);
    state.cache[col] = state.cache[col] ?? {};
    state.cache[col][id] = { ...(state.cache[col][id] ?? {}), ...serializeVal(patches) };
    save(userId, state);
    return;
  }

  await queueUpdate(userId, col, id, patches);
}

export async function deleteDocOnlineFirst(userId, col, id) {
  if (!userId) return;
  const state0 = load(userId);
  const createIdx = state0.queue.findIndex(
    (op) => op.op === 'create' && op.col === col && op.id === id,
  );
  if (createIdx !== -1) {
    // Never reached the server — cancel the pending create locally.
    await queueDelete(userId, col, id);
    return;
  }

  if (isOnline()) {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (err) {
      if (!isNetworkError(err)) throw err;
      await queueDelete(userId, col, id);
      return;
    }
    // Success — drop from cache, no queue op needed.
    const state = load(userId);
    state.cache[col] = state.cache[col] ?? {};
    delete state.cache[col][id];
    save(userId, state);
    return;
  }

  await queueDelete(userId, col, id);
}

// ─────────────────────────────────────────────────────────────
// Sync queue flush — pushes queued mutations to Firestore
// ─────────────────────────────────────────────────────────────

export async function flushPending(userId) {
  if (!userId) return;
  if (!isOnline()) return;

  let state = load(userId);
  const idMap = {};

  let i = 0;
  while (i < state.queue.length) {
    const op = state.queue[i];
    try {
      if (op.op === 'create') {
        if (idMap[op.id]) {
          // Already created earlier — just drop the stale entry.
          state.queue.splice(i, 1);
          continue;
        }
        const ref = await addDoc(collection(db, op.col), deserializeVal(op.data));
        idMap[op.id] = ref.id;
        const colCache = state.cache[op.col] ?? (state.cache[op.col] = {});
        if (colCache[op.id]) {
          colCache[ref.id] = colCache[op.id];
          delete colCache[op.id];
        }
        for (let j = i + 1; j < state.queue.length; j++) {
          if (state.queue[j].id === op.id) state.queue[j].id = ref.id;
          if (state.queue[j].data?.userPlantId === op.id) state.queue[j].data.userPlantId = ref.id;
        }
        state.queue.splice(i, 1);
      } else if (op.op === 'update') {
        const serverId = idMap[op.id] ?? op.id;
        await updateDoc(doc(db, op.col, serverId), deserializeVal(op.data));
        state.queue.splice(i, 1);
      } else if (op.op === 'delete') {
        const serverId = idMap[op.id] ?? op.id;
        const createIdx = state.queue.findIndex(
          (o) => o.op === 'create' && o.col === op.col && o.id === op.id && o !== op,
        );
        if (createIdx !== -1 && createIdx < i && !idMap[op.id]) {
          state.queue = state.queue.filter(
            (o, idx) => idx !== createIdx && idx !== i,
          );
          i = Math.max(0, i - 1);
          continue;
        }
        await deleteDoc(doc(db, op.col, serverId));
        const colCache = state.cache[op.col];
        if (colCache) {
          delete colCache[op.id];
          delete colCache[serverId];
        }
        state.queue.splice(i, 1);
      }
      save(userId, state);
    } catch (err) {
      if (isNetworkError(err)) return; // still offline — stop, keep the rest queued
      // Non-network failure (e.g. rules) — drop this op so it can't block the queue.
      console.warn('[offlineStore] dropping failed op', op, err);
      state.queue.splice(i, 1);
      save(userId, state);
    }
  }
}

export async function flushAll() {
  if (!activeUserId) return;
  await flushPending(activeUserId);
}

// ─────────────────────────────────────────────────────────────
// Auto-sync on reconnect
// ─────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushAll().catch((err) => console.warn('[offlineStore] auto-sync failed', err));
  });
  window.addEventListener('focus', () => {
    flushAll().catch((err) => console.warn('[offlineStore] auto-sync failed', err));
  });
}