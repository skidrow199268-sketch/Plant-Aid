
import { IoLeaf } from 'react-icons/io5';
import {
  GROWTH_STAGES,
  stageIndexOf,

} from '../services/GrowthJourneyService';
import {FALLBACK_IMAGE} from '../constant/growth'



export default function PlantSelectorCard({ userPlant, isActive, onClick }) {
  const stageIdx = stageIndexOf(userPlant.currentStage);
  const progress = Math.round((stageIdx / (GROWTH_STAGES.length - 1)) * 100);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
        isActive
          ? 'bg-white border-emerald-300 shadow-md'
          : 'bg-white/60 border-zinc-200 hover:border-emerald-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-50 border border-zinc-100 flex-shrink-0">
          {userPlant.imageUrl ? (
            <img
              src={userPlant.imageUrl}
              alt={userPlant.nickname}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IoLeaf className="text-xl text-emerald-300" />
            </div>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-bold text-zinc-900 truncate">{userPlant.nickname}</p>
          <p className="text-[11px] text-zinc-400 truncate">{userPlant.currentStage}</p>
          {/* Mini progress bar */}
          <div className="mt-1.5 w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}