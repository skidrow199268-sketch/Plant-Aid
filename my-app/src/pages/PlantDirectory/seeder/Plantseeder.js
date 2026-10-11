// ============================================================
// Plantseeder.js
// Seed logic for the Firestore `plants` collection.
// The plant catalog itself lives in ./data.js (plantsData) —
// this file only handles the Firebase side.
//
// Fresh-start seeding (wipe + rebuild) — safe to click again:
//   1. Deletes every existing doc in `plants`, so a re-run never
//      duplicates and removed entries disappear.
//   2. Inserts the full plantsData list with deterministic slug
//      IDs, so userPlants references (plantId) stay valid.
//   3. A module-level in-flight guard blocks concurrent runs.
//
// Does NOT run automatically — only called by the Seed button
// on the Plant Directory page.
// ============================================================

import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../../../firebase/firebase';

import { plantsData } from './data';

// ── Helpers ────────────────────────────────────────────────

/** Normalised name used for slug generation: lowercase, trimmed,
 *  trailing asterisks and extra whitespace removed. */
function normalizeName(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\*+$/, '')
    .replace(/\s+/g, ' ');
}

/** Deterministic Firestore doc ID from a plant name
 *  e.g. "Aloe Vera" -> "aloe-vera" */
function slugify(name = '') {
  return normalizeName(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Firestore caps a write batch at 500 ops — chunk deletions. */
const BATCH_LIMIT = 400;

// ── In-flight guard (blocks double-clicks / re-entry) ──────
let seedInProgress = false;

// ─────────────────────────────────────────────────────────────
// seedPlants
// ─────────────────────────────────────────────────────────────

/**
 * Wipe the `plants` collection and reseed it from ./data.js.
 *
 * @param {object}   [options]
 * @param {Function} [options.onProgress] – (done, total) after each write
 * @returns {Promise<{
 *   alreadyRunning?: boolean,
 *   total: number,
 *   cleared: number,
 *   imported: number,
 *   updated:  number,
 *   skipped:  number,
 *   errors:   string[],
 *   message:  string,
 * }>}
 */
export async function seedPlants({ onProgress } = {}) {
  if (seedInProgress) {
    return {
      alreadyRunning: true,
      total: 0, cleared: 0, imported: 0, updated: 0, skipped: 0, errors: [],
      message: 'Seed already in progress…',
    };
  }

  seedInProgress = true;
  try {
    // ── 1. Fresh start: delete everything currently in Firestore ──
    const snapshot = await getDocs(collection(db, 'plants'));
    const cleared = snapshot.size;

    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      snapshot.docs
        .slice(i, i + BATCH_LIMIT)
        .forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // ── 2. Insert the full catalog fresh ───────────────────
    let imported = 0;
    const errors = [];

    for (let i = 0; i < plantsData.length; i++) {
      const plant = plantsData[i];
      try {
        await setDoc(doc(db, 'plants', slugify(plant.name)), {
          ...plant,
          createdAt: Timestamp.now(),
        });
        imported++;
        onProgress?.(i + 1, plantsData.length);
      } catch (err) {
        console.error(`[PlantSeeder] Failed to seed "${plant.name}":`, err);
        errors.push(plant.name);
      }
    }

    // ── 3. Result message ──────────────────────────────────
    let message;
    if (errors.length === plantsData.length) {
      message = 'Seed failed for every plant — check Firestore rules and that you are signed in.';
    } else if (errors.length > 0) {
      message = `Fresh seed: cleared ${cleared}, inserted ${imported} of ${plantsData.length} — ${errors.length} failed (see console).`;
    } else {
      message = `Fresh seed complete: cleared ${cleared}, inserted ${imported} of ${plantsData.length}. No duplicates. ✅`;
    }

    console.log(`[PlantSeeder] ${message}`);
    if (errors.length > 0) console.log('[PlantSeeder] Failed:', errors);

    return {
      total: plantsData.length,
      cleared,
      imported,
      updated: 0,
      skipped: 0,
      errors,
      message,
    };
  } finally {
    seedInProgress = false;
  }
}
