// useScanCache.js
// Persists DiagnosticScan state to localStorage so a reload doesn't wipe it.
// Note: blob preview URLs (URL.createObjectURL) die on reload — we don't
// cache `preview`, we fall back to the Plant.id suggestion image instead.

import { useState, useEffect, useCallback } from 'react';

const CACHE_PREFIX = 'plantaid_scan_cache_';

function readCache(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(userId, data) {
  if (!userId) return;
  try {
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(data));
  } catch {
    // storage full / disabled — ignore
  }
}

function clearCacheStorage(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(CACHE_PREFIX + userId);
  } catch {
    // ignore
  }
}

/**
 * @param {string} userId
 * @returns {{
 *   cached: object|null,
 *   saveCache: (partial: object) => void,
 *   clearCache: () => void,
 * }}
 */
export function useScanCache(userId) {
  const [cached, setCached] = useState(() => readCache(userId));

  // re-read if userId becomes available after mount (auth resolves async)
  useEffect(() => {
    setCached(readCache(userId));
  }, [userId]);

  const saveCache = useCallback((partial) => {
    setCached((prev) => {
      const next = { ...(prev || {}), ...partial };
      writeCache(userId, next);
      return next;
    });
  }, [userId]);

  const clearCache = useCallback(() => {
    clearCacheStorage(userId);
    setCached(null);
  }, [userId]);

  return { cached, saveCache, clearCache };
}

export default useScanCache;