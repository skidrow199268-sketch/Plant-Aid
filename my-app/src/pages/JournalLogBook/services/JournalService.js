import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import {
  remoteThenLocal,
  remoteThenLocalDoc,
  createDocOnlineFirst,
  updateDocOnlineFirst,
  deleteDocOnlineFirst,
  getActiveUserId,
} from '../../../offline/offlineStore';


// ─────────────────────────────────────────────────────────────
// HELPER: convert + compress image file to base64 data URL
// ─────────────────────────────────────────────────────────────

/**
 * Convert an image File to a compressed base64 data URL.
 * Keeps Firestore document size small (no Storage bucket in use).
 *
 * @param {File}   file
 * @param {number} [maxWidth=1000]
 * @param {number} [quality=0.7]
 * @returns {Promise<string>} base64 data URL
 */
function fileToCompressedBase64(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


// ─────────────────────────────────────────────────────────────
// 1. FETCH JOURNALS
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all journal entries for a user, newest first.
 *
 * @param {string} userId
 * @returns {Promise<JournalDoc[]>}
 */
export async function fetchJournals(userId) {
  const docs = await remoteThenLocal(userId, 'journals', async () => {
    const q = query(
      collection(db, 'journals'),
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

export async function fetchJournalById(journalId) {
  const userId = getActiveUserId();
  return remoteThenLocalDoc(userId, 'journals', journalId, async () => {
    const snap = await getDoc(doc(db, 'journals', journalId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  });
}

export async function fetchJournalsByPlant(userId, userPlantId) {
  const docs = await remoteThenLocal(userId, 'journals', async () => {
    const q = query(
      collection(db, 'journals'),
      where('userId',      '==', userId),
      where('userPlantId', '==', userPlantId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  return docs
    .filter((j) => j.userPlantId === userPlantId)
    .sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return db_ - da;
    });
}


// ─────────────────────────────────────────────────────────────
// 2. CREATE JOURNAL
// ─────────────────────────────────────────────────────────────

/**
 * Create a new journal entry. Images are compressed and stored
 * as base64 data URLs directly in Firestore (no Storage bucket).
 *
 * @param {string} userId
 * @param {object} data
 * @param {string}    data.title
 * @param {string}    data.content
 * @param {string}    [data.userPlantId]      – optional plant link
 * @param {string}    [data.customPlantLabel] – optional custom plant name
 * @param {File}      [data.imageFile]        – optional image file
 * @returns {Promise<JournalDoc>}              – the newly created journal with id
 */
export async function createJournal(userId, {
  title,
  content,
  userPlantId = '',
  customPlantLabel = '',
  imageFile = null,
}) {
  let imageUrl = '';

  if (imageFile) {
    imageUrl = await fileToCompressedBase64(imageFile);
  }

  const payload = {
    userId,
    userPlantId,
    customPlantLabel,
    title:     title.trim(),
    content:   content.trim(),
    imageUrl,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  return createDocOnlineFirst(userId, 'journals', payload);
}


// ─────────────────────────────────────────────────────────────
// 3. UPDATE JOURNAL
// ─────────────────────────────────────────────────────────────

/**
 * Update an existing journal entry. If a new imageFile is provided,
 * it's compressed and replaces the stored base64 image.
 *
 * @param {string} journalId
 * @param {string} userId
 * @param {object} data
 * @param {string}    [data.title]
 * @param {string}    [data.content]
 * @param {string}    [data.userPlantId]
 * @param {string}    [data.customPlantLabel]
 * @param {File}      [data.imageFile]    – new image to replace existing one
 * @param {boolean}   [data.removeImage]  – set true to clear the image
 * @returns {Promise<{ imageUrl: string|undefined }>} the new imageUrl (if changed)
 */
export async function updateJournal(journalId, userId, {
  title,
  content,
  userPlantId,
  customPlantLabel,
  imageFile = null,
  removeImage = false,
}) {
  const updates = {
    updatedAt: Timestamp.now(),
  };

  if (title             !== undefined) updates.title             = title.trim();
  if (content           !== undefined) updates.content           = content.trim();
  if (userPlantId       !== undefined) updates.userPlantId       = userPlantId;
  if (customPlantLabel  !== undefined) updates.customPlantLabel  = customPlantLabel;

  if (imageFile) {
    updates.imageUrl = await fileToCompressedBase64(imageFile);
  } else if (removeImage) {
    updates.imageUrl = '';
  }

  await updateDocOnlineFirst(userId, 'journals', journalId, updates);

  return { imageUrl: updates.imageUrl };
}

export async function deleteJournal(journalId) {
  const userId = getActiveUserId();
  await deleteDocOnlineFirst(userId, 'journals', journalId);
}

export async function deleteJournalWithImage(journalId, imageUrl) {
  void imageUrl;
  await deleteJournal(journalId);
}


// ─────────────────────────────────────────────────────────────
// 5. HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Format a Firestore Timestamp or JS Date to a readable string.
 * e.g. "June 03, 2026"
 *
 * @param {Timestamp|Date|null} ts
 * @returns {string}
 */
export function formatJournalDate(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   '2-digit',
  });
}