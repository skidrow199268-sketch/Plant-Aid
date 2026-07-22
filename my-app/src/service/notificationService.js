// ============================================================
// NotificationService.js
// Real-time notifications from reminders collection.
// ============================================================

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const REMINDERS_COLLECTION = 'reminders';

// ─────────────────────────────────────────────────────────────
// 1. REAL-TIME LISTENER — all incomplete reminders for user
// Returns unsubscribe function — call on component unmount
// ─────────────────────────────────────────────────────────────
export function subscribeNotifications(userId, onChange) {
  if (!userId) {
    onChange([]);
    return () => {};
  }

  const q = query(
    collection(db, REMINDERS_COLLECTION),
    where('userId',    '==', userId),
    where('completed', '==', false),
    orderBy('reminderDate', 'desc'),
  );

  return onSnapshot(q, (snap) => {
    const now = new Date();
    const data = snap.docs.map((d) => {
      const item = d.data();
      const due  = item.reminderDate?.toDate?.();
      return {
        id:           d.id,
        title:        item.title       || 'Reminder',
        type:         item.type        || 'CUSTOM',
        reminderDate: item.reminderDate,
        userPlantId:  item.userPlantId || null,
        completed:    item.completed,
        unread:       due ? due <= now : false,
        overdue:      due ? due <  now : false,
      };
    });
    onChange(data);
  },
  (err) => {
    console.error('Notification listener error:', err);
    // If index error, log the link from err.message
  });
}

// ─────────────────────────────────────────────────────────────
// 2. MARK REMINDER AS COMPLETED (dismiss)
// ─────────────────────────────────────────────────────────────
export async function markReminderCompleted(reminderId) {
  const ref = doc(db, REMINDERS_COLLECTION, reminderId);
  await updateDoc(ref, { completed: true });
}

// ─────────────────────────────────────────────────────────────
// 3. EMAIL ALERT FOR OVERDUE REMINDERS
// ─────────────────────────────────────────────────────────────
import emailjs from '@emailjs/browser';
import { getDoc } from 'firebase/firestore';

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_REMINDER_TEMPLATE_ID 
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const NOTIFIED_KEY = 'plantaid_overdue_notified';

function getNotifiedSet(userId) {
  try {
    const raw = localStorage.getItem(`${NOTIFIED_KEY}_${userId}`);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveNotifiedSet(userId, set) {
  try {
    localStorage.setItem(`${NOTIFIED_KEY}_${userId}`, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

function formatReminderDateTime(ts) {
  if (!ts) return { date: '—', time: '—' };
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return {
    date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

function getOverdueLabel(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return '';

  const diffMins  = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1)  return `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`;
  if (diffHours >= 1) return `${diffHours} hour${diffHours > 1 ? 's' : ''} overdue`;
  if (diffMins >= 1)  return `${diffMins} min${diffMins > 1 ? 's' : ''} overdue`;
  return 'Overdue';
}

/**
 * Checks the given reminders list for overdue items and sends an
 * email alert (once per reminder, tracked in localStorage) to the user.
 *
 * @param {Array} reminders - list from subscribeNotifications callback
 * @param {{ userId: string, toEmail: string, toName?: string }} user
 * @returns {Promise<Array>} overdue reminders
 */
export async function checkAndNotifyOverdueReminders(reminders, { userId, toEmail, toName }) {
  if (!userId || !toEmail) return [];

  const overdue = (reminders || []).filter((r) => r.overdue && !r.completed);
  if (overdue.length === 0) return [];

  const notified = getNotifiedSet(userId);
  const newlyOverdue = overdue.filter((r) => !notified.has(r.id));

  for (const reminder of newlyOverdue) {
    try {
      let plantName = reminder.customPlantName || null;
      if (!plantName && reminder.userPlantId) {
        const snap = await getDoc(doc(db, 'userPlants', reminder.userPlantId));
        plantName = snap.exists() ? snap.data()?.nickname : null;
      }

      const { date, time } = formatReminderDateTime(reminder.reminderDate);

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:      toEmail,
          to_name:       toName || 'there',
          plant_name:    plantName || 'your plant',
          task_title:    reminder.title,
          task_type:     reminder.type,
          due_date:      date,
          due_time:      time,
          overdue_label: getOverdueLabel(reminder.reminderDate),
        },
        EMAILJS_PUBLIC_KEY,
      );

      notified.add(reminder.id);
    } catch (err) {
      console.error('Failed to send overdue email for reminder', reminder.id, err);
    }
  }

  saveNotifiedSet(userId, notified);

  return overdue;
}