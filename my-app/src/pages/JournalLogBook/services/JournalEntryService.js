// ============================================================
// NewJournalEntryService.js
// Data layer for the New Journal Entry screen.
// Follows the same pattern as JournalService.js
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
} from '../../../offline/offlineStore';


// ─────────────────────────────────────────────────────────────
// 1. USER PLANTS  (for the plant selector dropdown)
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

  return docs.sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return db_ - da;
  });
}


// ─────────────────────────────────────────────────────────────
// 2. PUBLISH JOURNAL ENTRY
// ─────────────────────────────────────────────────────────────

export async function publishJournalEntry(userId, {
  title,
  content,
  userPlantId = '',
}) {
  const payload = {
    userId,
    userPlantId,
    title:     title.trim(),
    content:   content.trim(),
    imageUrl:  '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  return createDocOnlineFirst(userId, 'journals', payload);
}


// ─────────────────────────────────────────────────────────────
// 3. HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Get today's date formatted for display in the editor.
 * e.g. "June 04, 2026"
 *
 * @returns {string}
 */
export function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   '2-digit',
  });
}

/**
 * Validate journal entry fields before publishing.
 * Returns an error message string, or null if valid.
 *
 * @param {string} title
 * @param {string} content
 * @returns {string|null}
 */
export function validateEntry(title, content) {
  if (!title.trim())   return 'Please add a title before publishing.';
  if (!content.trim()) return 'Please add some notes before publishing.';
  return null;
}