import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../pages/Auth/Service/AuthContext';

import {

  MdClose,
  MdPhotoCamera,
  MdCheckCircle,
 
} from 'react-icons/md';

import {
  runScanPipeline,

  getHealthConfig,
} from '../pages/DiagnosticScan/services/Diagnostic';

import {UploadPrompt,ScanningState,ErrorState,NotPlantState,QuickResult} from './index'
import { useScanCache } from '../pages/DiagnosticScan/hooks/useScanCache';
import {PhotoModeModal} from './index'; 
import { ScanSuccessModal } from '../pages/DiagnosticScan/components/index';

const MAX_BATCH = 9;
const MIN_BATCH = 3;


export default function CameraSheet({ onClose }) {
  const { currentUser } = useAuth();
  const userId   = currentUser?.uid ?? null;
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [preview,   setPreview]   = useState('');
  const [scanning,  setScanning]  = useState(false);
  const [result,    setResult]    = useState(null);
  const [scanError, setScanError] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successPlantData, setSuccessPlantData] = useState(null);

  const { saveCache, clearCache } = useScanCache(userId);

  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); 
  const [multiActive,   setMultiActive]   = useState(false);
  const [batch,         setBatch]         = useState([]);  

  const cameraInputRef = useRef(null);
  const multiFileRef   = useRef(null); 

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFile = useCallback(async (fileOrFiles) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    const valid = files.filter((f) => f && f.type?.startsWith('image/'));
    if (valid.length === 0) return;
    if (!userId) { setScanError('Please sign in to scan plants.'); return; }

    const localUrl = URL.createObjectURL(valid[0]);
    setPreview(localUrl);
    setResult(null);
    setScanError(null);
    setScanning(true);

  
    setSuccessModalOpen(false);
    setSuccessPlantData(null);

    try {
      const { scanId, result: scanResult } = await runScanPipeline(userId, valid.length === 1 ? valid[0] : valid, {});
      setResult(scanResult);
      saveCache({ scanResult, scanId }); // so /diagnostic-scan hydrates with this scan

      // ── NEW: pop the success modal once identification lands ──
      if (scanResult.isPlant && scanResult.suggestions?.length > 0) {
        const topMatch   = scanResult.suggestions[0];
        const confidence = Math.round((topMatch?.probability ?? 0) * 100);

        setSuccessPlantData({
          commonName:     topMatch?.commonNames?.[0] || topMatch?.name || 'Unknown Plant',
          scientificName: topMatch?.name || '',
          imageSrc:       topMatch?.imageUrl || localUrl,
          confidence,
          healthStatus:   scanResult.isHealthy ? 'Healthy' : 'Needs Attention',
          anomalies:      scanResult.diseases?.length > 0
                            ? scanResult.diseases.map(d => d.commonNames?.[0] || d.name).join(', ')
                            : 'None',
        });
        setSuccessModalOpen(true);
      }
    } catch (err) {
      console.error('Quick scan error:', err);
      setScanError('Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  }, [userId, saveCache]);

  useEffect(() => {
    const handler = (e) => handleFile(e.detail);
    window.addEventListener('quick-scan-file', handler);
    return () => window.removeEventListener('quick-scan-file', handler);
  }, [handleFile]);

 
  const openModeModal = (action) => {
    setPendingAction(action);
    setModeModalOpen(true);
  };

  const handleModeSelect = (mode) => {
    setModeModalOpen(false);
    const action = pendingAction;
    setPendingAction(null);

    if (action === 'camera') {
      if (mode === 'single') {
        cameraInputRef.current?.click();
      } else {
        setBatch([]);
        setMultiActive(true);
        cameraInputRef.current?.click();
      }
    } else if (action === 'upload') {
      if (mode === 'single') {
        fileRef.current?.click();
      } else {
        setBatch([]);
        setMultiActive(true);
        multiFileRef.current?.click();
      }
    }
  };

  const handleCameraInputChange = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (multiActive) {
      setBatch((prev) => (prev.length < MAX_BATCH ? [...prev, file] : prev));
    } else {
      handleFile(file);
    }
  };

  const handleMultiGalleryChange = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    setMultiActive(false);
    if (files.length === 0) return;
    handleFile(files.slice(0, MAX_BATCH));
  };

  const finishMultiCapture = () => {
    setMultiActive(false);
    if (batch.length > 0) handleFile(batch);
    setBatch([]);
  };

  const cancelMultiCapture = () => {
    setMultiActive(false);
    setBatch([]);
  };

  const handleViewDetails = useCallback(() => {
    onClose();
    navigate('/diagnostic-scan');
  }, [navigate, onClose]);

  const handleReset = useCallback(() => {
    setPreview('');
    setResult(null);
    setScanError(null);
    setSuccessModalOpen(false);
    setSuccessPlantData(null);
    clearCache();
  }, [clearCache]);

  // ── NEW: modal save handler ──────────────────────────────
  const handleModalSave = useCallback(() => {
    setSuccessModalOpen(false);
    // hook into garden catalog save logic here if needed
  }, []);

  const topMatch   = result?.suggestions?.[0];
  const healthCfg  = result ? getHealthConfig(result.isHealthy, result.isHealthyScore) : null;
  const confidence = topMatch ? Math.round((topMatch.probability ?? 0) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#fbf8ff] rounded-t-3xl shadow-2xl"
        style={{ maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#c8c5ca]/60 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#c8c5ca]/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#a6f2d1] flex items-center justify-center">
              <MdPhotoCamera className="text-[#1b6b51] text-base" />
            </div>
            <span className="text-base font-bold text-black dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quick Scan
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e8e7f1] transition-colors"
          >
            <MdClose className="text-[#47464a] text-lg" />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {!preview && !scanning && !result && !multiActive && (
            <UploadPrompt
              onFile={handleFile}
              onTakePhoto={() => openModeModal('camera')}
              onChooseFiles={() => openModeModal('upload')}
            />
          )}

          {/* ── NEW: multi-capture batch panel ─────────── */}
          {multiActive && (
            <div className="space-y-3.5">
              {/* Header + progress */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-black truncate">
                    {batch.length}/{MAX_BATCH} photos
                  </p>
                  <p className="text-[11px] text-[#47464a]">
                    {batch.length < MIN_BATCH ? `Need ${MIN_BATCH - batch.length} more for accurate scan` : 'Ready to scan'}
                  </p>
                </div>
                <button
                  onClick={cancelMultiCapture}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-[#e8e7f1]"
                >
                  <MdClose className="text-[#47464a] text-lg" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-[#e8e7f1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1b6b51] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (batch.length / MAX_BATCH) * 100)}%` }}
                />
              </div>

              {/* Thumbnails */}
              {batch.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
                  {batch.map((f, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Capture ${i + 1}`}
                        className="w-14 h-14 rounded-xl object-cover border border-[#c8c5ca]/50"
                      />
                      <button
                        onClick={() => setBatch((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow-md"
                      >
                        <MdClose className="text-[10px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions — equal-width grid so long labels can't force a wrap/overflow */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={batch.length >= MAX_BATCH}
                  className="flex flex-col items-center justify-center gap-1 min-w-0 bg-black text-white py-3 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <MdPhotoCamera className="text-lg" />
                  <span className="text-xs font-bold truncate">Capture</span>
                </button>
                <button
                  onClick={finishMultiCapture}
                  disabled={batch.length < MIN_BATCH}
                  className="flex flex-col items-center justify-center gap-1 min-w-0 bg-[#1b6b51] text-white py-3 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <MdCheckCircle className="text-lg" />
                  <span className="text-xs font-bold truncate">
                    {batch.length < MIN_BATCH ? `Done (${MIN_BATCH - batch.length})` : 'Done'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {scanning && <ScanningState preview={preview} />}
          {scanError && !scanning && (
            <ErrorState message={scanError} onRetry={handleReset} />
          )}
          {result && !result.isPlant && !scanning && (
            <NotPlantState score={result.isPlantScore} onRetry={handleReset} />
          )}
          {result && result.isPlant && !scanning && topMatch && (
            <QuickResult
              preview={preview}
              topMatch={topMatch}
              confidence={confidence}
              healthCfg={healthCfg}
              result={result}
              onRetry={handleReset}
              onViewDetails={handleViewDetails}
            />
          )}
        </div>

        <div className="h-6" />
      </div>

      {/* ── NEW: success modal — pops as soon as identification lands ── */}
      <ScanSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        onSave={handleModalSave}
        plantData={successPlantData}
      />

      {/* ── NEW: photo mode picker ──────────────────────── */}
      <PhotoModeModal
        open={modeModalOpen}
        onSelect={handleModeSelect}
        onClose={() => { setModeModalOpen(false); setPendingAction(null); }}
      />

      {/* Single gallery pick (kept for UploadPrompt drag/drop passthrough) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      {/* NEW: multi-select gallery input */}
      <input
        ref={multiFileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleMultiGalleryChange(e.target.files); e.target.value = ''; }}
      />
      {/* NEW: native camera-only capture, reused per shot for the batch loop */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleCameraInputChange(e.target.files?.[0]); e.target.value = ''; }}
      />
    </>
  );
}