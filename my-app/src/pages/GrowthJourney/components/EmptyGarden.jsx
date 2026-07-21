
import { FaSeedling } from 'react-icons/fa6';


export default function EmptyGarden({ onNavigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-5">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <FaSeedling className="text-4xl text-emerald-300" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-bold text-zinc-800">No plants yet</p>
        <p className="text-sm text-zinc-400 max-w-xs">
          Add plants to your garden to start tracking their growth journey.
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="px-6 py-3 bg-zinc-950 text-white text-sm font-bold rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all"
      >
        Browse Plant Directory
      </button>
    </div>
  );
}