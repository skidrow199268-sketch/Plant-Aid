import React, { useState, useEffect, useCallback, useRef, useDeferredValue } from 'react';
import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, Footer, MobileNav } from '../../../components/index';

import {
  fetchJournals,
  createJournal,
  deleteJournalWithImage,
  updateJournal,

} from '../services/JournalService';

import {
  fetchUserPlantsForSelector,

} from '../services/JournalEntryService';
import {DeleteModal,EmptyState,EntryModal,JournalCard,Toast} from '../components/index'
// React Icons
import {
  MdSearch,
  MdAdd,
  MdErrorOutline,

} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { FaSeedling } from 'react-icons/fa6';


export default function JournalLogbook() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid ?? null;

  // ── Data state ───────────────────────────────────────────
  const [entries,   setEntries]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dataError, setDataError] = useState(null);

  // ── Plants for selector ───────────────────────────────────
  const [plants,        setPlants]        = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(true);

  // ── Search ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery.toLowerCase().trim());

  // ── Modal state ──────────────────────────────────────────
  const [entryModal,  setEntryModal]  = useState({ open: false, mode: 'new', entry: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, entry: null });
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // ── Toast ────────────────────────────────────────────────
  const [toast,     setToast]     = useState({ visible: false, message: '', type: 'success', showUndo: false });
  const [undoEntry, setUndoEntry] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success', showUndo = false) => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type, showUndo });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      showUndo ? 6000 : 3000,
    );
  }, []);

  // ── Load journals + plants on mount ──────────────────────
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);
      setDataError(null);
      try {
        const data = await fetchJournals(userId);
        setEntries(data);
      } catch (err) {
        console.error('Journal load error:', err);
        setDataError('Failed to load journal entries. Please check your connection.');
      } finally {
        setLoading(false);
      }
    })();

    // Plants load independently — non-blocking
    (async () => {
      setLoadingPlants(true);
      try {
        const data = await fetchUserPlantsForSelector(userId);
        setPlants(data);
      } catch (err) {
        console.warn('Plant selector load failed (non-fatal):', err);
      } finally {
        setLoadingPlants(false);
      }
    })();
  }, [userId]);

  // ── Create / Edit handler ─────────────────────────────────
const handleSave = useCallback(async ({ title, content, imageFile, userPlantId, customPlantLabel }) => {
    if (!userId) return;
    setSaving(true);

    try {
      if (entryModal.mode === 'new') {
        const newEntry = await createJournal(userId, {
          title,
          content,
          userPlantId,
          customPlantLabel,
          imageFile,
        });
        setEntries((prev) => [newEntry, ...prev]);
        showToast('Journal entry published!');
      } else {
        const result = await updateJournal(entryModal.entry.id, userId, {
          title,
          content,
          userPlantId,
          customPlantLabel,
          imageFile,
        });
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryModal.entry.id
              ? {
                  ...e,
                  title,
                  content,
                  userPlantId,
                  customPlantLabel,
                  ...(result.imageUrl !== undefined ? { imageUrl: result.imageUrl } : {}),
                }
              : e,
          ),
        );
        showToast('Entry updated successfully.');
      }
      setEntryModal({ open: false, mode: 'new', entry: null });
    } catch (err) {
      console.error('Save journal error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }, [userId, entryModal, showToast]);
  // ── Delete handler ────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    const entry = deleteModal.entry;
    if (!entry) return;
    setDeleting(true);

    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setUndoEntry(entry);
    setDeleteModal({ open: false, entry: null });

    try {
      await deleteJournalWithImage(entry.id, entry.imageUrl);
      showToast('Entry deleted.', 'success', true);
    } catch (err) {
      console.error('Delete journal error:', err);
      setEntries((prev) =>
        [entry, ...prev].sort((a, b) => {
          const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt);
          const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt);
          return tb - ta;
        }),
      );
      showToast('Could not delete entry. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }, [deleteModal, showToast]);

  // ── Undo delete ───────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!undoEntry) return;
    setEntries((prev) => {
      if (prev.some((e) => e.id === undoEntry.id)) return prev;
      return [undoEntry, ...prev].sort((a, b) => {
        const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt);
        const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt);
        return tb - ta;
      });
    });
    setUndoEntry(null);
    setToast((t) => ({ ...t, visible: false }));
    showToast('Entry restored.');
  }, [undoEntry, showToast]);

  // ── Filtered entries ──────────────────────────────────────
  const filteredEntries = entries.filter((e) =>
    !deferredQuery ||
    e.title?.toLowerCase().includes(deferredQuery) ||
    e.content?.toLowerCase().includes(deferredQuery),
  );

  if (loading) return <FullPageLoader message="Loading your journal" />;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="bg-[#fbf8ff] pb-28 md:pb-0 text-[#1a1b22] min-h-screen flex flex-col antialiased selection:bg-[#a6f2d1] selection:text-[#1b6b51]">
        <Topbar />
        <div className="block md:hidden">
  <MobileNav />
</div>


        <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">

          {/* Page header */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#1b6b51]">
                <IoLeaf className="text-base" />
                <span className="text-xs font-bold uppercase tracking-widest">Botanical Records</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">Journal Logbook</h1>
              <p className="text-[#47464a] text-sm">
                Documenting the growth of your botanical sanctuary.
                {entries.length > 0 && (
                  <span className="ml-2 text-[#1b6b51] font-semibold">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative group">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#47464a] group-focus-within:text-[#1b6b51] transition-colors text-lg" />
                <input
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#1b6b51]/20 focus:border-[#1b6b51] outline-none transition-all w-full sm:w-56 text-sm text-black dark:text-white"
                  placeholder="Search entries…"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-sm"
                  >✕</button>
                )}
              </div>

              {/* New entry button */}
              <button
                onClick={() => setEntryModal({ open: true, mode: 'new', entry: null })}
                aria-label="New journal entry"
                className="bg-black text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:scale-[0.98] active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
              >
                <MdAdd className="text-lg" />
               <p className="hidden lg:block"> New Entry</p>
              </button>
            </div>
          </section>

          {/* Error banner */}
          {dataError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
              <MdErrorOutline className="text-base flex-shrink-0" />
              {dataError}
            </div>
          )}

          {/* Journal grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.length === 0 ? (
              <EmptyState
                isFiltered={!!deferredQuery}
                onNew={() => setEntryModal({ open: true, mode: 'new', entry: null })}
              />
            ) : (
              filteredEntries.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  onDelete={(e) => setDeleteModal({ open: true, entry: e })}
                  onEdit={(e)   => setEntryModal({ open: true, mode: 'edit', entry: e })}
                />
              ))
            )}
          </section>
        </main>

        {/* Footer */}
        <div className="hidden lg:block">
 <Footer/>
</div>
       
        {/* Entry modal */}
        {entryModal.open && (
          <EntryModal
            mode={entryModal.mode}
            entry={entryModal.entry}
            onClose={() => setEntryModal({ open: false, mode: 'new', entry: null })}
            onSave={handleSave}
            saving={saving}
            plants={plants}
            loadingPlants={loadingPlants}
          />
        )}

        {/* Delete confirmation */}
        {deleteModal.open && (
          <DeleteModal
            entry={deleteModal.entry}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteModal({ open: false, entry: null })}
            deleting={deleting}
          />
        )}

        <Toast toast={toast} onUndo={handleUndo} />
      </div>
    </>
  );
}