import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../Auth/Service/AuthContext';

import { Topbar, FullPageLoader, MobileNav, Footer } from '../../../components/index';
import {
  runScanPipeline,
  fetchScanHistory,

} from '../services/Diagnostic';
import {
  runAnalysisPipeline,
} from '../services/PlantAnalysis';

import {  ScanSuccessModal } from '../components/index';
import { MdErrorOutline, MdBiotech,} from 'react-icons/md';
import {BentoGridTips,NotAPlantCard,PlantIdResultPanel,ScanHistory,ScannerViewport} from '../components/index'
import { useScanCache } from '../hooks/useScanCache';


export default function DiagnosticScan() {
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const userId = currentUser?.uid ?? null;

  // ── Scanner state ────────────────────────────────────────
  const [activeOrgan,    setActiveOrgan]    = useState('Auto');
  const [preview,        setPreview]        = useState('');
  const [scanning,       setScanning]       = useState(false);
  const [scanResult,     setScanResult]     = useState(null);
  const [scanError,      setScanError]      = useState(null);
  const [scanId,         setScanId]         = useState(null);

  // ── Gemini analysis state ────────────────────────────────
  const [analysis,        setAnalysis]        = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError,   setAnalysisError]   = useState(null);

  // ── History ──────────────────────────────────────────────
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ── NEW: Success modal state ─────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalPlantData, setModalPlantData] = useState(null);

  // ── Scan cache (survives page reload) ────────────────────
  const { cached, saveCache, clearCache } = useScanCache(userId);

  // ── Load scan history on mount ───────────────────────────
  useEffect(() => {
    if (!userId) { setLoadingHistory(false); return; }
    (async () => {
      try {
        const data = await fetchScanHistory(userId, 8);
        setHistory(data);
      } catch (err) {
        console.error('Scan history load error:', err);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [userId]);

  // ── Hydrate scan state from cache once userId resolves ───
  useEffect(() => {
    if (cached?.scanResult) {
      setScanResult(cached.scanResult);
      setAnalysis(cached.analysis || null);
      setScanId(cached.scanId || null);
      setActiveOrgan(cached.activeOrgan || 'Auto');
      // blob preview URLs die on reload — fall back to Plant.id's own image
      setPreview(cached.scanResult.suggestions?.[0]?.imageUrl || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cached]);


  const handleScanAnother = useCallback(() => {
  fileInputRef.current?.click();
}, []);

  // ── Handle file(s) → Plant.id → Gemini ───────────────────
  // CHANGED: fileOrFiles can now be a single File OR a File[] (3-9
  // photos) coming from ScannerViewport's multi-capture/multi-select flow.
  const handleFileSelected = useCallback(async (fileOrFiles) => {
    if (!userId) return;

    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    if (files.length === 0 || !files[0]) return;

    const localUrl = URL.createObjectURL(files[0]);
    setPreview(localUrl);
    setScanResult(null);
    setScanError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setScanId(null);
    setScanning(true);

    // Close modal if it was open from a previous scan
    setModalOpen(false);
    setModalPlantData(null);

    try {
      const organ = activeOrgan === 'Auto' ? undefined : activeOrgan.toLowerCase();

      // ── Step 1: Plant.id identification (single file or multi-photo array) ──
      const { scanId: newScanId, result } = await runScanPipeline(
        userId,
        files.length === 1 ? files[0] : files,
        { organ },
      );
      setScanResult(result);
      setScanId(newScanId);
      saveCache({ scanResult: result, scanId: newScanId, activeOrgan });

      if (result.isPlant) {
        fetchScanHistory(userId, 8).then(setHistory).catch(() => {});
      }

      setScanning(false);

      // ── NEW: Show success modal after successful plant scan ──
      if (result.isPlant && result.suggestions?.length > 0) {
        const topMatch = result.suggestions[0];
        const confidence = Math.round((topMatch?.probability ?? 0) * 100);

        setModalPlantData({
          commonName:     topMatch?.commonNames?.[0] || topMatch?.name || 'Unknown Plant',
          scientificName: topMatch?.name || '',
          imageSrc:       topMatch?.imageUrl || localUrl,
          confidence,
          healthStatus:   result.isHealthy ? 'Healthy' : 'Needs Attention',
          anomalies:      result.diseases?.length > 0
                            ? result.diseases.map(d => d.commonNames?.[0] || d.name).join(', ')
                            : 'None',
        });
        setModalOpen(true);
      }

      // ── Step 2: Gemini analysis (runs after scan completes) ──
      if (result.isPlant && result.suggestions?.length > 0) {
        setAnalysisLoading(true);
        setAnalysisError(null);
        try {
          const { analysis: geminiAnalysis } = await runAnalysisPipeline(userId, newScanId, result);
          setAnalysis(geminiAnalysis);
          saveCache({ analysis: geminiAnalysis });
        } catch (geminiErr) {
          console.error('Gemini analysis error:', geminiErr);
          setAnalysisError(geminiErr.message || 'Gemini analysis failed. You can still view the identification results.');
        } finally {
          setAnalysisLoading(false);
        }
      }

    } catch (err) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Scan failed. Please try again.');
      setScanning(false);
    }
  }, [userId, activeOrgan, saveCache]);

  // ── Reset ────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setScanResult(null);
    setScanError(null);
    setAnalysis(null);
    setAnalysisError(null);
    setPreview('');
    setScanId(null);
    setModalOpen(false);
    setModalPlantData(null);
    clearCache();
  }, [clearCache]);

  // ── NEW: Modal save handler ──────────────────────────────
  const handleModalSave = useCallback(() => {
    // Close the modal — the full results are already shown below
    setModalOpen(false);
    // You can hook into your garden catalog save logic here if needed
  }, []);

  if (loadingHistory && !currentUser) {
    return <FullPageLoader message="Preparing diagnostic scanner" />;
  }

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b22] min-h-screen flex flex-col overflow-x-hidden" style={{ fontFamily: 'Manrope, sans-serif' }}>
      <style>{`
        @keyframes pulse-bracket {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.04); }
        }
      `}</style>
        {/* Desktop topbar — hidden on small screens */}
<div className="hidden lg:block">
  <Topbar />
</div>

{/* Mobile topbar — visible only on small screens */}
<div className="block lg:hidden">
  <MobileNav />
</div>
    

      {/* ── NEW: Success Modal ───────────────────────────── */}
      <ScanSuccessModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        plantData={modalPlantData}
      />

      <main className="flex-grow flex flex-col items-center px-4 md:px-6 py-8 max-w-7xl mx-auto w-full gap-6 pb-28 lg:pb-8">

        <section className="text-center space-y-1 max-w-xl">
          <div className="flex items-center justify-center gap-2 text-[#1b6b51] mb-2">
            <MdBiotech className="text-xl" />
            <span className="text-xs font-bold uppercase tracking-widest">AI Identification</span>
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Diagnostic Scan
          </h1>
          <p className="text-sm text-[#47464a]">
            Upload a photo for AI-powered plant identification and deep botanical analysis.
          </p>
        </section>

        {scanError && (
          <div className="w-full max-w-3xl flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
            <MdErrorOutline className="flex-shrink-0 text-lg" />
            <span>{scanError}</span>
            <button onClick={handleRetry} className="ml-auto text-xs font-bold underline hover:opacity-70">Dismiss</button>
          </div>
        )}

        {scanResult && (
  <div className="w-full max-w-3xl flex justify-center">
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelected(file);
        e.target.value = ''; // allow re-selecting same file
      }}
    />
    <button
      onClick={handleScanAnother}
      className="flex items-center gap-2 bg-[#1b6b51] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <MdBiotech className="text-base" />
      Scan Another Plant
    </button>
  </div>
)}

        {!scanResult ? (
          <ScannerViewport
            activeOrgan={activeOrgan}
            setActiveOrgan={setActiveOrgan}
            onFileSelected={handleFileSelected}
            scanning={scanning}
            preview={preview}
          />
        ) : scanResult.isPlant ? (
          <PlantIdResultPanel
            result={scanResult}
            preview={preview}
            onRetry={handleRetry}
            analysis={analysis}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
          />
        ) : (
          <NotAPlantCard score={scanResult.isPlantScore} onRetry={handleRetry} />
        )}

        {!scanning && <ScanHistory history={history} />}
        {!scanResult && <BentoGridTips />}
      </main>
      <div className="hidden lg:block">
 <Footer />
</div>



    </div>
  );
}