
import { MdCheckCircle,MdErrorOutline,} from 'react-icons/md';

export default function Toast({ toast, onUndo }) {
  return (
    <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
    }`}>
      <div className="bg-[#1a1b22] text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-6 min-w-[260px]">
        <div className="flex items-center gap-2">
          {toast.type === 'error'
            ? <MdErrorOutline className="text-red-400 text-lg" />
            : <MdCheckCircle  className="text-emerald-400 text-lg" />
          }
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
        {toast.showUndo && (
          <button
            onClick={onUndo}
            className="text-[#a6f2d1] text-sm font-bold hover:opacity-80 transition-opacity ml-auto"
          >
            UNDO
          </button>
        )}
      </div>
    </div>
  );
}