// ============================================================
// TaskManagerService.js
// Data layer for the PlantAid Task Manager screen.
// Offline-first: reads resolve from a local cache (refreshed by
// Firestore when online), writes apply locally and auto-sync.
// ============================================================

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import {
  remoteThenLocal,
  createDocOnlineFirst,
  updateDocOnlineFirst,
  deleteDocOnlineFirst,
  getActiveUserId,
} from '../../../offline/offlineStore';

// ─────────────────────────────────────────────────────────────
// 1. FETCH REMINDERS  (tasks = reminders in your schema)
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

export async function fetchTasks(userId) {
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

export async function fetchPendingTasks(userId) {
  const docs = await remoteThenLocal(userId, 'reminders', async () => {
    const q = query(
      collection(db, 'reminders'),
      where('userId',    '==', userId),
      where('completed', '==', false),
      orderBy('reminderDate', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return sortByReminderDate(docs.filter((t) => !t.completed));
}


// ─────────────────────────────────────────────────────────────
// 2. CREATE TASK
// ─────────────────────────────────────────────────────────────

export async function createTask(userId, {
  title,
  type,
  reminderDate,
  userPlantId = '',
  notes       = '',
}) {
  const fullTitle = notes.trim()
    ? `${title.trim()} — ${notes.trim()}`
    : title.trim();

  const payload = {
    userId,
    userPlantId,
    title:        fullTitle,
    type,
    reminderDate: Timestamp.fromDate(reminderDate),
    completed:    false,
    createdAt:    Timestamp.now(),
  };

  return createDocOnlineFirst(userId, 'reminders', payload);
}


// ─────────────────────────────────────────────────────────────
// 3. COMPLETE / UNCOMPLETE TASK
// ─────────────────────────────────────────────────────────────

export async function completeTask(taskId) {
  const userId = getActiveUserId();
  await updateDocOnlineFirst(userId, 'reminders', taskId, { completed: true });
}

export async function uncompleteTask(taskId) {
  const userId = getActiveUserId();
  await updateDocOnlineFirst(userId, 'reminders', taskId, { completed: false });
}


// ─────────────────────────────────────────────────────────────
// 4. DELETE TASK
// ─────────────────────────────────────────────────────────────

export async function deleteTask(taskId) {
  const userId = getActiveUserId();
  await deleteDocOnlineFirst(userId, 'reminders', taskId);
}


// ─────────────────────────────────────────────────────────────
// 5. USER PLANTS  (for the plant selector dropdown)
// ─────────────────────────────────────────────────────────────

export async function fetchUserPlantsForSelector(userId) {
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
// 6. AGGREGATE — single call loads everything the page needs
// ─────────────────────────────────────────────────────────────

export async function loadTaskManagerPage(userId) {
  const [tasks, userPlants] = await Promise.all([
    fetchTasks(userId),
    fetchUserPlantsForSelector(userId),
  ]);
  return { tasks, userPlants };
}


// ─────────────────────────────────────────────────────────────
// 7. HELPERS
// ─────────────────────────────────────────────────────────────

export function categoryToType(categoryId) {
  const map = {
    water:     'WATER',
    fertilize: 'FERTILIZE',
    repot:     'REPOT',
    prune:     'CUSTOM',
  };
  return map[categoryId] ?? 'CUSTOM';
}

export function typeToCategory(type) {
  const map = {
    WATER:     'water',
    FERTILIZE: 'fertilize',
    REPOT:     'repot',
    CUSTOM:    'prune',
  };
  return map[type] ?? 'prune';
}

export function formatTaskTime(ts) {
  if (!ts) return '';
  const date  = ts?.toDate ? ts.toDate() : new Date(ts);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((d - today) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (diff === 0)            return `Today, ${timeStr}`;
  if (diff === 1)            return `Tomorrow, ${timeStr}`;
  if (diff > 1 && diff < 7) return `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export function computeTaskStats(tasks) {
  const now       = new Date();
  const pending   = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) =>  t.completed);
  const overdue   = pending.filter((t) => {
    const d = t.reminderDate?.toDate ? t.reminderDate.toDate() : new Date(t.reminderDate);
    return d < now;
  });

  return {
    total:     tasks.length,
    pending:   pending.length,
    completed: completed.length,
    overdue:   overdue.length,
  };
}