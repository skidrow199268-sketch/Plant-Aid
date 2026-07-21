
// React Icons
import {
  MdArrowForward,
  MdArrowBack,
  MdCalendarToday,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import {
  GROWTH_STAGES,
  formatTimestamp,
} from '../services/GrowthJourneyService';
import {FALLBACK_IMAGE} from '../constant/growth'
import {HealthBadge} from './index'
export default function PlantHeroCard({ selectedPlant, masterPlant, health, currentStageIdx, savingStage, onAdvance, onRetreat }) {
  return (
    <div className="mb-6 p-5 bg-white border border-zinc-200/60 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-100 flex-shrink-0">
        {selectedPlant.imageUrl ? (
          <img 
            src={selectedPlant.imageUrl} 
            alt={selectedPlant.nickname} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        ) : (
          <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
            <IoLeaf className="text-2xl text-emerald-300" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-grow min-w-0">
        <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight truncate">
          {selectedPlant.nickname}
        </h2>
        {masterPlant?.scientificName && (
          <p className="text-xs italic text-zinc-400">{masterPlant.scientificName}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <HealthBadge status={health} />
          <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <MdCalendarToday className="text-[13px]" />
            Planted {formatTimestamp(selectedPlant.plantedDate)}
          </span>
        </div>
      </div>
      {/* Stage controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          disabled={savingStage || currentStageIdx === 0}
          onClick={onRetreat}
          title="Go back one stage"
          className="w-9 h-9 rounded-xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <MdArrowBack />
        </button>
        <button
          disabled={savingStage || currentStageIdx === GROWTH_STAGES.length - 1}
          onClick={onAdvance}
          title="Advance one stage"
          className="w-9 h-9 rounded-xl bg-[#064e3b] text-white flex items-center justify-center hover:bg-[#053d2f] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
        >
          {savingStage ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <MdArrowForward />
          )}
        </button>
      </div>
    </div>
  );
}
