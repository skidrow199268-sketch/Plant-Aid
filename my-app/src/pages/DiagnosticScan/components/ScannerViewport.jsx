import { useState, useRef } from 'react';
import {
  MdPhotoCamera,
  MdUploadFile,
  MdClose,
  MdCheckCircle,
} from 'react-icons/md';
import { ORGANS } from '../utils/diagnosticUtils';
import {PhotoModeModal} from '../../../components/index'; // TODO: adjust path to wherever you place this shared file

const MAX_BATCH = 9;
const MIN_BATCH = 3;

export default function ScannerViewport({ activeOrgan, setActiveOrgan, onFileSelected, scanning, preview }) {
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  // ── NEW: photo-mode modal + multi-capture batch state ────
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'camera' | 'upload'
  const [multiActive,   setMultiActive]   = useState(false);
  const [batch,         setBatch]         = useState([]);   // File[]

  const fileRef       = useRef(null); // single gallery pick
  const multiFileRef   = useRef(null); // multi gallery pick
  const cameraInputRef = useRef(null); // native single-shot camera
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onFileSelected(file);
  };

  // ── NEW: open the mode picker before either action ──────
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
        isMobile ? handleCameraCapture() : openWebcam();
      } else {
        setBatch([]);
        setMultiActive(true);
        isMobile ? handleCameraCapture() : openWebcam();
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

  // ── Native camera capture (mobile) ──────────────────────
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  // Fired by the hidden cameraInputRef input — routes to batch or single
  const handleCameraInputChange = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (multiActive) {
      setBatch((prev) => (prev.length < MAX_BATCH ? [...prev, file] : prev));
    } else {
      handleFile(file);
    }
  };

  // ── Multi gallery pick (native picker allows multi-select) ──
  const handleMultiGalleryChange = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    setMultiActive(false);
    if (files.length === 0) return;
    onFileSelected(files.slice(0, MAX_BATCH));
  };

  // ── In-browser webcam (desktop fallback) ────────────────
  const openWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      // fallback to file input
      cameraInputRef.current?.click();
    }
  };

  const closeWebcam = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (multiActive) {
        // keep webcam open, just add to the batch
        setBatch((prev) => (prev.length < MAX_BATCH ? [...prev, file] : prev));
      } else {
        closeWebcam();
        onFileSelected(file);
      }
    }, 'image/jpeg', 0.92);
  };

  // ── NEW: finish/cancel a multi-capture batch ────────────
  const finishMultiCapture = () => {
    closeWebcam();
    setMultiActive(false);
    if (batch.length > 0) onFileSelected(batch);
    setBatch([]);
  };

  const cancelMultiCapture = () => {
    closeWebcam();
    setMultiActive(false);
    setBatch([]);
  };

  // Detect mobile to use native camera input instead of webcam API
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* ── NEW: Photo mode picker ──────────────────────── */}
      <PhotoModeModal
        open={modeModalOpen}
        onSelect={handleModeSelect}
        onClose={() => { setModeModalOpen(false); setPendingAction(null); }}
      />

      {/* ── Webcam Modal (desktop) ─────────────────────── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-4">
          <div className="relative w-full max-w-lg rounded-[24px] overflow-hidden border-4 border-[#1b6b51] shadow-2xl bg-black">
            <video
              ref={videoRef}
              className="w-full h-auto"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Close */}
            <button
              onClick={multiActive ? cancelMultiCapture : closeWebcam}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black transition"
            >
              <MdClose className="text-xl" />
            </button>

            {/* NEW: batch counter while collecting multiple shots */}
            {multiActive && (
              <div className="absolute top-3 left-3 bg-[#1b6b51] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {batch.length}/{MAX_BATCH} photos
              </div>
            )}
          </div>

          {/* Capture button */}
          <button
            onClick={captureFromWebcam}
            disabled={multiActive && batch.length >= MAX_BATCH}
            className="w-[72px] h-[72px] rounded-full bg-white border-4 border-[#1b6b51] flex items-center justify-center shadow-xl active:scale-90 transition-all disabled:opacity-40"
          >
            <MdPhotoCamera className="text-[32px] text-[#1b6b51]" />
          </button>

          {!multiActive ? (
            <p className="text-white/60 text-xs">Tap the button to capture</p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={cancelMultiCapture}
                className="text-white/70 text-xs font-semibold px-4 py-2 rounded-full border border-white/20 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={finishMultiCapture}
                disabled={batch.length < MIN_BATCH}
                className="flex items-center gap-1.5 whitespace-nowrap text-white text-xs font-bold px-5 py-2 rounded-full bg-[#1b6b51] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MdCheckCircle className="text-sm" />
                {batch.length < MIN_BATCH ? `Done (${MIN_BATCH - batch.length})` : 'Done'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── NEW: mobile multi-capture batch panel (native camera loop) ── */}
      {multiActive && isMobile && !cameraOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#fbf8ff] rounded-t-3xl shadow-2xl px-4 pt-4 space-y-3.5"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
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
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <button
              onClick={handleCameraCapture}
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

      {/* ── Scanner Viewport ───────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => !scanning && openModeModal('upload')}
        className={`w-full max-w-3xl bg-zinc-950 rounded-[28px] overflow-hidden relative shadow-2xl border-4 cursor-pointer transition-all duration-300 ${
          isDragging ? 'border-[#1b6b51] scale-[1.01]'
          : scanning  ? 'border-[#1b6b51]/60 cursor-wait'
          :              'border-white hover:border-[#1b6b51]/60'
        }`}
        style={{ aspectRatio: '9/16', maxHeight: '70vh' }}
      >
        {preview ? (
          <img src={preview} alt="Scan preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-900 to-zinc-950">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <MdPhotoCamera className="text-4xl text-zinc-500" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Drag an image or tap to upload</p>
          </div>
        )}

        {scanning && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
            <div className="w-16 h-16 rounded-full border-4 border-[#1b6b51]/30 border-t-[#1b6b51] animate-spin" />
            <p className="text-white text-sm font-semibold">Analysing specimen…</p>
            <p className="text-white/50 text-xs">Plant.id AI + Gemini are working</p>
          </div>
        )}

        {!scanning && (
          <div className="absolute inset-0 pointer-events-none p-6">
            {[
              'top-6 left-6 border-t-4 border-l-4 rounded-tl-xl',
              'top-6 right-6 border-t-4 border-r-4 rounded-tr-xl',
              'bottom-6 left-6 border-b-4 border-l-4 rounded-bl-xl',
              'bottom-6 right-6 border-b-4 border-r-4 rounded-br-xl',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-10 h-10 border-white/30 ${cls} animate-pulse`} />
            ))}
          </div>
        )}

        {!scanning && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-900/30 backdrop-blur-sm border border-emerald-500/30 rounded-lg px-3 py-1.5 z-10">
            <div className="w-2 h-2 bg-[#1b6b51] rounded-full animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-[#1b6b51] font-bold">Live Precision Engine</span>
          </div>
        )}

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center bg-zinc-900/80 backdrop-blur-md rounded-full p-1.5 border border-white/10 z-10">
          {ORGANS.map((organ) => (
            <button
              key={organ}
              onClick={(e) => { e.stopPropagation(); setActiveOrgan(organ); }}
              className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
                activeOrgan === organ ? 'bg-[#1b6b51] text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {organ}
            </button>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* ── Hidden file inputs ─────────────────────────── */}
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
      {/* Mobile native camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleCameraInputChange(e.target.files?.[0]); e.target.value = ''; }}
      />

      {/* ── Action Buttons ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4">

        {/* Camera button */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#1b6b51]/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
            <button
              onClick={() => { if (scanning) return; openModeModal('camera'); }}
              disabled={scanning}
              className="relative z-10 w-[72px] h-[72px] bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200 border-4 border-[#fbf8ff] hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-wait"
            >
              <MdPhotoCamera className="text-[28px]" />
            </button>
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">Take Photo</span>
        </div>

        <div className="text-zinc-400 text-xs font-semibold">or</div>

        {/* Upload from gallery */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => !scanning && openModeModal('upload')}
            disabled={scanning}
            className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-[#1b6b51]/50 flex items-center justify-center text-[#1b6b51] hover:bg-[#1b6b51]/10 active:scale-90 transition-all disabled:opacity-40"
          >
            <MdUploadFile className="text-[28px]" />
          </button>
          <span className="text-[11px] text-zinc-500 font-medium">Upload File</span>
        </div>
      </div>
    </div>
  );
}