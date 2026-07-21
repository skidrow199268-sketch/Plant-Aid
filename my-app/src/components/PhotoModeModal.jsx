// PhotoModeModal.jsx
// Shared modal: lets user pick "1 Photo (Quick)" or "3-9 Photos (Accurate)".
// Used by both ScannerViewport.jsx and CameraSheet.jsx.
//
// Usage:
//   <PhotoModeModal open={modeModalOpen} onSelect={(mode) => ...} onClose={() => setModeModalOpen(false)} />
//   mode is either 'single' or 'multi'

import { MdClose, MdBolt, MdAutoAwesome } from 'react-icons/md';

export default function PhotoModeModal({ open, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-black dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Scan Accuracy
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e8e7f1] transition-colors"
          >
            <MdClose className="text-[#47464a] text-lg" />
          </button>
        </div>

        <button
          onClick={() => onSelect('single')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[#c8c5ca]/50 hover:border-[#1b6b51]/50 hover:bg-[#a6f2d1]/10 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <MdBolt className="text-xl text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-black dark:text-white">1 Photo — Quick</p>
            <p className="text-xs text-[#47464a] mt-0.5">Fastest, good for a clear single shot</p>
          </div>
        </button>

        <button
          onClick={() => onSelect('multi')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[#1b6b51]/40 bg-[#a6f2d1]/10 hover:bg-[#a6f2d1]/20 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#a6f2d1] flex items-center justify-center flex-shrink-0">
            <MdAutoAwesome className="text-xl text-[#1b6b51]" />
          </div>
          <div>
            <p className="text-sm font-bold text-black dark:text-white">3–9 Photos — More Accurate</p>
            <p className="text-xs text-[#47464a] mt-0.5">Different angles (leaf, flower, bark) improve identification</p>
          </div>
        </button>
      </div>
    </div>
  );
}