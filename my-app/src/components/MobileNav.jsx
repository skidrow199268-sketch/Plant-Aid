// ============================================================
// MobileNav.jsx
// Bottom nav bar with integrated quick-scan camera sheet,
// notifications popup, active route persistence via localStorage,
// and smooth animated active indicator.
// ============================================================
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';

import {
  MdHome,
  MdOutlineEco,
  MdAdd,
 
  MdClose,
  MdPhotoCamera,

  MdNotificationsNone,
  MdCollections,
  MdTipsAndUpdates,
  MdHomeFilled,
  MdHistory,
  MdUploadFile,
} from 'react-icons/md';



import {CameraSheet,NotificationsPopup,NavButton} from './index'

const STORAGE_KEY = 'plantaid_active_route';


export default function MobileNav() {
  const NAV_ITEMS = [
  {
    label:      'Today',
    path:       '/dashboard',
    Icon:       MdHome,
    IconActive: MdHomeFilled,
  },
  {
    label:      'Collection',
    path:       '/collection',
    Icon:       MdCollections,
    IconActive: MdCollections,
  },
  {
    label:      'Plants',
    path:       '/plants',
    Icon:       MdOutlineEco,
    IconActive: MdOutlineEco,
  },
  {
    label:      'Tips',
    path:       '/tips',
    Icon:       MdTipsAndUpdates,
    IconActive: MdTipsAndUpdates,
  },
];

  const [webcamOpen, setWebcamOpen] = useState(false);
  const videoRef = useRef(null);
const canvasRef = useRef(null);
const streamRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDiagnostic = location.pathname === '/diagnostic-scan';

  const [activeRoute, setActiveRoute] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || location.pathname;
  });

  useEffect(() => {
    setActiveRoute(location.pathname);
    localStorage.setItem(STORAGE_KEY, location.pathname);
  }, [location.pathname]);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [fabOpen,    setFabOpen]    = useState(false);

  const handleNavigate = (path) => {
    setActiveRoute(path);
    localStorage.setItem(STORAGE_KEY, path);
    navigate(path);
  };

  return (
    <>
      {/* ── Bottom Nav Bar ───────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-700 z-40 pb-safe">
        <nav className="flex items-end justify-between h-16 w-full max-w-md mx-auto px-2">

          {/* Left two items */}
          <div className="flex flex-1 items-end justify-around pb-2">
            {NAV_ITEMS.slice(0, 2).map((item) => (
              <NavButton
                key={item.path}
                item={item}
                isActive={activeRoute === item.path}
                onClick={() => handleNavigate(item.path)}
              />
            ))}
          </div>

          {/* Center — FAB or History Log button */}
          <div className="flex items-end justify-center pb-2 px-3">
            {!isOnDiagnostic ? (
              <div className="relative flex flex-col items-center" style={{ marginBottom: '12px' }}>

                {/* Mini popover */}
                {fabOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-row items-center gap-3 bg-white rounded-2xl shadow-xl border border-[#c8c5ca]/40 px-4 py-3">
                      {/* Capture */}
                      <button
                        onClick={() => {
  setFabOpen(false);
  setWebcamOpen(true);
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    })
    .catch(() => {
      // fallback to file input if camera denied
      cameraInputRef.current?.click();
      setWebcamOpen(false);
    });
}}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-all"
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#a6f2d1]/40 flex items-center justify-center">
                          <MdPhotoCamera className="text-[22px] text-[#1b6b51]" />
                        </div>
                        <span className="text-[9px] font-semibold text-[#1b6b51]">Capture</span>
                      </button>

                      {/* Divider */}
                      <div className="w-px h-10 bg-[#c8c5ca]/40" />

                      {/* Upload */}
                      <button
                        onClick={() => { setFabOpen(false); setCameraOpen(true); }}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-all"
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#a6f2d1]/40 flex items-center justify-center">
                          <MdUploadFile className="text-[22px] text-[#1b6b51]" />
                        </div>
                        <span className="text-[9px] font-semibold text-[#1b6b51]">Upload</span>
                      </button>
                    </div>
                  </>
                )}

                {/* FAB */}
                <button
                  onClick={() => setFabOpen(prev => !prev)}
                  className={`
                    flex items-center justify-center
                    w-14 h-14 rounded-full text-white
                    shadow-[0_8px_20px_-4px_rgba(27,107,81,0.5)]
                    active:scale-90 transition-all duration-200 ease-out
                    ${fabOpen ? 'bg-[#237157]' : 'bg-[#1b6b51] hover:bg-[#237157]'}
                  `}
                  aria-label="Quick plant scan"
                >
                  <MdAdd className={`text-3xl transition-transform duration-200 ${fabOpen ? 'rotate-45' : 'rotate-0'}`} />
                </button>
              </div>
            ) : (
              /* ── History log button (shown only on /diagnostic-scan) ── */
              <div className="relative" style={{ marginBottom: '12px' }}>
                <button
                  onClick={() => handleNavigate('/history-logs')}
                  className="
                    flex flex-col items-center justify-center
                    w-14 h-14 rounded-full
                    bg-[#eeedf7] text-[#1b6b51]
                    shadow-[0_4px_12px_-2px_rgba(27,107,81,0.15)]
                    hover:bg-[#a6f2d1]/40
                    active:scale-90
                    transition-all duration-200 ease-out
                  "
                  aria-label="Scan history"
                >
                  <MdHistory className="text-2xl" />
                </button>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[#1b6b51] whitespace-nowrap">
                  History
                </span>
              </div>
            )}
          </div>

          {/* Right two items */}
          <div className="flex flex-1 items-end justify-around pb-2">
            {NAV_ITEMS.slice(2).map((item) => (
              <NavButton
                key={item.path}
                item={item}
                isActive={activeRoute === item.path}
                onClick={() => handleNavigate(item.path)}
              />
            ))}
          </div>

        </nav>
      </div>

      {/* Camera sheet */}
      {cameraOpen && (
        <CameraSheet onClose={() => setCameraOpen(false)} />
      )}

      {/* Notifications popup */}
      {notifOpen && (
        <NotificationsPopup onClose={() => setNotifOpen(false)} />
      )}

      {/* Hidden native camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setCameraOpen(true);
            setTimeout(() => {
              const event = new CustomEvent('quick-scan-file', { detail: file });
              window.dispatchEvent(event);
            }, 100);
          }
          e.target.value = '';
        }}
      />

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setCameraOpen(true);
            setTimeout(() => {
              const event = new CustomEvent('quick-scan-file', { detail: file });
              window.dispatchEvent(event);
            }, 100);
          }
          e.target.value = '';
        }}
      />

      {/* Webcam Modal */}
{webcamOpen && (
  <>
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-4">
     <div className="relative w-full max-w-sm rounded-[24px] overflow-hidden border-4 border-[#1b6b51] shadow-2xl bg-black" style={{ height: '65vh' }}>
       <video
  ref={videoRef}
  className="w-full h-full object-cover"
  autoPlay
  playsInline
  muted
/>
        <canvas ref={canvasRef} className="hidden" />
        <button
          onClick={() => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            setWebcamOpen(false);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"
        >
          <MdClose className="text-xl" />
        </button>
      </div>

      {/* Shutter button */}
      <button
        onClick={() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            streamRef.current?.getTracks().forEach(t => t.stop());
            setWebcamOpen(false);
            setCameraOpen(true);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('quick-scan-file', { detail: file }));
            }, 100);
          }, 'image/jpeg', 0.92);
        }}
        className="w-[72px] h-[72px] rounded-full bg-white border-4 border-[#1b6b51] flex items-center justify-center shadow-xl active:scale-90 transition-all"
      >
        <MdPhotoCamera className="text-[32px] text-[#1b6b51]" />
      </button>
      <p className="text-white/60 text-xs">Tap to capture</p>
    </div>
  </>
)}
    </>
  );
}