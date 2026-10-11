import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, Footer, MobileNav } from '../../../components/index';

import {
  loadHistoryScreenData,
  fetchScanHistory,
  deleteScanRecord,
  deriveStatusType,
  deriveStatusLabel,
  formatScanDate,
  formatConfidenceLabel,
} from '../services/History';

import {
  MdRefresh,
  MdHistory,
  MdBiotech,
  MdClose,
  MdCheckCircle,
  MdWarning,
  MdHelpOutline,
} from 'react-icons/md';

import { BackButton, DeleteModal, EmptyState, FilterBar, ScanLogCard, StatsStrip } from '../components/index'


// ============================================================
// Scan Detail Modal (in-file component)
// ============================================================
function ScanDetailModal({ record, isOpen, onClose }) {
  if (!isOpen || !record) return null;

  const statusType  = deriveStatusType(record);
  const statusLabel = deriveStatusLabel(record);

  const statusStyles = {
    solved:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', icon: <MdCheckCircle className="text-base" /> },
    danger:  { bg: 'bg-red-50',      text: 'text-red-700',     icon: <MdWarning className="text-base" /> },
    neutral: { bg: 'bg-[#eeedf7]',    text: 'text-[#47464a]',   icon: <MdHelpOutline className="text-base" /> },
  };
  const style = statusStyles[statusType] ?? statusStyles.neutral;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {record.imageUrl && (
          <div className="w-full h-56 bg-[#eeedf7] rounded-t-3xl overflow-hidden">
            <img
              src={record.imageUrl}
              alt={record.commonName || 'Scanned plant'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Close button */}
          <div className="flex justify-end mb-2 -mt-2">
            <button
              onClick={onClose}
              className="text-[#c8c5ca] hover:text-[#1a1b22] transition-colors"
              aria-label="Close"
            >
              <MdClose className="text-2xl" />
            </button>
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 ${style.bg} ${style.text} text-xs font-bold px-3 py-1.5 rounded-full mb-3`}>
            {style.icon}
            {statusLabel}
          </div>

          {/* Names */}
          <h2 className="text-2xl font-bold text-black">
            {record.commonName || 'Unknown Plant'}
          </h2>
          {record.scientificName && (
            <p className="text-sm text-[#47464a] italic mt-1">{record.scientificName}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-4 text-sm text-[#47464a]">
            <span>{formatScanDate(record.scannedAt)}</span>
            <span className="text-[#c8c5ca]">•</span>
            <span>{formatConfidenceLabel(record.confidence)}</span>
          </div>

          {/* Disease details */}
          {record.detectedDisease?.trim() && (
            <div className="mt-5 bg-red-50 border border-red-100 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-red-700 mb-1">
                {record.detectedDisease}
              </h3>
              {record.diseaseProbability != null && (
                <p className="text-xs text-red-600 mb-2">
                  {Math.round(record.diseaseProbability)}% probability
                </p>
              )}
              {record.diseaseDescription && (
                <p className="text-sm text-[#47464a] leading-relaxed">
                  {record.diseaseDescription}
                </p>
              )}
            </div>
          )}

          {/* Healthy message */}
          {record.isHealthy && !record.detectedDisease?.trim() && (
            <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-sm text-emerald-700">
                No issues detected — this plant looks healthy.
              </p>
            </div>
          )}

          {/* Not a plant message */}
          {!record.isPlant && (
            <div className="mt-5 bg-[#f4f2fd] border border-[#eeedf7] rounded-2xl p-4">
              <p className="text-sm text-[#47464a]">
                This image wasn't recognized as a plant.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// Main Screen
// ============================================================
export default function ScanningHistoryLogs() {
  const navigate          = useNavigate();
  const { currentUser }   = useAuth();
  const userId            = currentUser?.uid ?? null;

  // ── Data state ───────────────────────────────────────────
  const [records,      setRecords]      = useState([]);
  const [stats,        setStats]        = useState({ total: 0, healthy: 0, diseased: 0, unknown: 0 });
  const [lastDoc,      setLastDoc]      = useState(null);   // pagination cursor
  const [hasMore,      setHasMore]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState(null);

  // ── Filter state ─────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('All');

  // ── Delete state ─────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);   // scanId pending confirm
  const [deletingId,   setDeletingId]   = useState(null);   // scanId being deleted

  // ── Detail modal state ───────────────────────────────────
  const [detailRecord, setDetailRecord] = useState(null);   // full record being viewed

  // ── Card menu state ──────────────────────────────────────
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close any open card menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenuId]);

  // ── Load on mount ────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadHistoryScreenData(userId, 20);
        setRecords(data.records);
        setStats(data.stats);
        setLastDoc(data.lastDoc);
        setHasMore(!!data.lastDoc);
      } catch (err) {
        console.error('History load error:', err);
        setError('Could not load scan history. Please check your connection.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // ── Load more (pagination) ───────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!userId || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { records: more, lastDoc: nextCursor } = await fetchScanHistory(userId, 20, lastDoc);
      setRecords((prev) => [...prev, ...more]);
      setLastDoc(nextCursor);
      setHasMore(!!nextCursor);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, lastDoc, loadingMore]);

  // ── Delete flow ──────────────────────────────────────────
  const handleDeleteRequest = (scanId) => setDeleteTarget(scanId);
  const handleDeleteCancel  = () => setDeleteTarget(null);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget);
    try {
      await deleteScanRecord(deleteTarget);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget));
      setStats((prev) => {
        const deleted = records.find((r) => r.id === deleteTarget);
        if (!deleted) return prev;
        const type = deriveStatusType(deleted);
        return {
          total:    Math.max(0, prev.total    - 1),
          healthy:  type === 'solved'  ? Math.max(0, prev.healthy  - 1) : prev.healthy,
          diseased: type === 'danger'  ? Math.max(0, prev.diseased - 1) : prev.diseased,
          unknown:  type === 'neutral' ? Math.max(0, prev.unknown  - 1) : prev.unknown,
        };
      });
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }, [deleteTarget, records]);

  // ── View details (opens modal instead of navigating) ─────
const handleViewDetails = (scanId) => {
  const record = records.find((r) => r.id === scanId);
  setDetailRecord(record ?? null);
};

  // ── Client-side filtering ────────────────────────────────
  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'All')              return true;
    if (activeFilter === 'Healthy')          return r.isHealthy && !r.detectedDisease?.trim();
    if (activeFilter === 'Disease Detected') return !!r.detectedDisease?.trim();
    if (activeFilter === 'Identified')       return !r.isHealthy && !r.detectedDisease?.trim();
    return true;
  });

  // ── Full-page loader ─────────────────────────────────────
  if (loading) {
    return <FullPageLoader message="Loading your scan history" />;
  }

  return (
    <div className="font-sans text-base antialiased overflow-x-hidden min-h-screen flex flex-col bg-[#fbf8ff] pb-28 md:pb-0">
      <Topbar />
      <div className="block md:hidden"><MobileNav /></div>

      <DeleteModal
        isOpen={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        deleting={!!deletingId}
      />

      <ScanDetailModal
        record={detailRecord}
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
      />

      <main className="flex-grow bg-[#fbf8ff] px-4 md:px-6 py-8 md:py-10">
        <div className="max-w-3xl mx-auto">

          {/* Page Header */}
          <header className="mb-8">
            <BackButton onClick={() => navigate('/diagnostic-scan')} />

            <div className="flex items-center gap-2 text-[#1b6b51] mb-3">
              <MdHistory className="text-lg" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Scan Records</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-black tracking-tight">
                  Scanning History
                </h1>
                <p className="text-sm text-[#47464a] mt-1">
                  {stats.total} total scan{stats.total !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <button
                onClick={() => navigate('/diagnostic-scan')}
                className="flex items-center gap-2 bg-[#1b6b51] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#237157] active:scale-95 transition-all self-start md:self-auto shadow-sm"
              >
                <MdBiotech className="text-base" />
                New Scan
              </button>
            </div>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
              <span>⚠️</span>
              {error}
              <button
                onClick={() => window.location.reload()}
                className="ml-auto flex items-center gap-1 text-xs font-bold hover:opacity-70"
              >
                <MdRefresh /> Retry
              </button>
            </div>
          )}

          {/* Stats */}
          {records.length > 0 && <StatsStrip stats={stats} />}

          {/* Filter Bar */}
          {records.length > 0 && (
            <FilterBar active={activeFilter} onChange={setActiveFilter} />
          )}

          {/* List */}
          {filteredRecords.length === 0 ? (
            <EmptyState
              filtered={activeFilter !== 'All' || records.length > 0}
              onGoScan={() => navigate('/diagnostic-scan')}
            />
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <ScanLogCard
                  key={record.id}
                  record={record}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteRequest}
                  deleting={deletingId === record.id}
                  menuOpen={openMenuId === record.id}
                  onToggleMenu={(id) => setOpenMenuId((prev) => (prev === id ? null : id))}
                  onCloseMenu={() => setOpenMenuId(null)}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && activeFilter === 'All' && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-white border border-[#c8c5ca] rounded-2xl font-bold text-black hover:bg-[#f4f2fd] transition-all shadow-sm text-sm disabled:opacity-50"
              >
                {loadingMore
                  ? <span className="w-4 h-4 border-2 border-[#47464a] border-t-transparent rounded-full animate-spin" />
                  : <MdRefresh className="text-base" />
                }
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}