// RemindersService.js
// Centralised data layer for the Reminders Checklist screen.
// Offline-first: reads come from a local cache (refreshed by
// Firestore when online) and writes are applied locally then
// synced when the connection returns.
// ============================================================

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import {
  readAll,
  remoteThenLocal,
  remoteThenLocalDoc,
  createDocOnlineFirst,
  updateDocOnlineFirst,
  deleteDocOnlineFirst,
  upsertAndReapply,
  getActiveUserId,
  isOnline,
} from '../../../offline/offlineStore';


// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export const REMINDER_TYPES = ['WATER', 'FERTILIZE', 'REPOT', 'CUSTOM'];

export const REMINDER_TYPE_LABELS = {
  WATER:     'Water',
  FERTILIZE: 'Fertilize',
  REPOT:     'Repot',
  CUSTOM:    'Custom',
};


// ─────────────────────────────────────────────────────────────
// 1. READ (one-shot)
// ─────────────────────────────────────────────────────────────

const sortByReminderDate = (docs) =>
  [...docs].sort((a, b) => {
    const da = a.reminderDate?.toDate ? a.reminderDate.toDate() : new Date(a.reminderDate);
    const db_ = b.reminderDate?.toDate ? b.reminderDate.toDate() : new Date(b.reminderDate);
    return da - db_;
  });

const sortByCreatedDesc = (docs) =>
  [...docs].sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return db_ - da;
  });

export async function fetchAllReminders(userId) {
  const docs = await remoteThenLocal(userId, 'reminders', async () => {
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      orderBy('reminderDate', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return sortByReminderDate(docs);
}

export async function fetchTodayReminders(userId) {
  const docs = await remoteThenLocal(userId, 'reminders', async () => {
    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      where('reminderDate', '>=', Timestamp.fromDate(startOfDay)),
      where('reminderDate', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('reminderDate', 'asc'),
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  const now        = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return docs.filter((t) => {
    const d = t.reminderDate?.toDate ? t.reminderDate.toDate() : new Date(t.reminderDate);
    return d >= startOfDay && d <= endOfDay;
  });
}

export async function fetchUserPlantForReminder(userPlantId) {
  if (!userPlantId) return null;
  const userId = getActiveUserId();
  return remoteThenLocalDoc(userId, 'userPlants', userPlantId, async () => {
    const snap = await getDoc(doc(db, 'userPlants', userPlantId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
}

export async function fetchUserPlantsForForm(userId) {
  const docs = await remoteThenLocal(userId, 'userPlants', async () => {
    const q = query(
      collection(db, 'userPlants'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return sortByCreatedDesc(docs);
}


// ─────────────────────────────────────────────────────────────
// 2. REAL-TIME LISTENER  (falls back to cache when offline)
// ─────────────────────────────────────────────────────────────

export function subscribeTodayReminders(userId, onChange) {
  if (!userId) {
    onChange([]);
    return () => {};
  }

  const emitTodayFromCache = () => {
    const all = readAll(userId, 'reminders').filter((t) => {
      const d = t.reminderDate?.toDate ? t.reminderDate.toDate() : new Date(t.reminderDate);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return d >= start && d <= end;
    });
    onChange(sortByReminderDate(all));
  };

  if (!isOnline()) {
    emitTodayFromCache();
    return () => {};
  }

  const now        = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const q = query(
    collection(db, 'reminders'),
    where('userId', '==', userId),
    where('reminderDate', '>=', Timestamp.fromDate(startOfDay)),
    where('reminderDate', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('reminderDate', 'asc'),
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      upsertAndReapply(userId, 'reminders', docs);
      onChange(docs);
    },
    () => emitTodayFromCache(),
  );
  return unsub;
}


// ─────────────────────────────────────────────────────────────
// 3. WRITE
// ─────────────────────────────────────────────────────────────

export async function createReminder(data) {
  const payload = {
    userId:       data.userId,
    userPlantId:  data.userPlantId ?? '',
    title:        data.title,
    type:         data.type,
    reminderDate: data.reminderDate instanceof Date
      ? Timestamp.fromDate(data.reminderDate)
      : data.reminderDate,
    completed: false,
    createdAt: Timestamp.now(),
  };
  const created = await createDocOnlineFirst(data.userId, 'reminders', payload);
  return created.id;
}

export async function setReminderCompleted(reminderId, completed) {
  const userId = getActiveUserId();
  await updateDocOnlineFirst(userId, 'reminders', reminderId, { completed });
}

export async function deleteReminder(reminderId) {
  const userId = getActiveUserId();
  await deleteDocOnlineFirst(userId, 'reminders', reminderId);
}


// ─────────────────────────────────────────────────────────────
// 4. AGGREGATE – kept for any other screens that still use it
// ─────────────────────────────────────────────────────────────

export async function loadChecklistData(userId) {
  const tasks = await fetchTodayReminders(userId);
  const userPlants = await fetchUserPlantsForForm(userId);

  const nicknameMap = {};
  for (const up of userPlants) {
    nicknameMap[up.id] = up.nickname ?? '';
  }

  const enriched = tasks.map((t) => ({
    ...t,
    plantNickname: nicknameMap[t.userPlantId] ?? '',
  }));

  return { tasks: enriched, userPlants };
}


// ─────────────────────────────────────────────────────────────
// 5. DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────

export function formatTime(ts) {
  if (!ts) return '—';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(ts) {
  if (!ts) return '—';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

export function datetimeLocalToTimestamp(datetimeLocalStr) {
  return Timestamp.fromDate(new Date(datetimeLocalStr));
}

export function timestampToDatetimeLocal(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const pad  = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}