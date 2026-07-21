
import {
  MdInfoOutline,
  MdTimeline,
} from 'react-icons/md';

import {
  GROWTH_STAGES,
} from '../services/GrowthJourneyService';

import {StageRow} from './index'

export default function GrowthTimeline({ currentStageIdx, onSelect, activeTrackPct }) {
  return (
    <div className="lg:col-span-3 p-6 bg-white border border-zinc-200/60 rounded-3xl shadow-sm">
      <h3 className="text-sm font-bold text-zinc-800 mb-6 uppercase tracking-widest flex items-center gap-2">
        <MdTimeline className="text-[#064e3b]" />
        Growth Timeline
      </h3>
      <div className="relative space-y-10">
        <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-zinc-100 -z-10" />
        <div
          className="absolute left-[17px] top-4 w-[2px] bg-[#064e3b] transition-all duration-500 origin-top -z-10"
          style={{ height: activeTrackPct }}
        />
        {GROWTH_STAGES.map((stage, idx) => (
          <StageRow
            key={stage.key}
            stage={stage}
            index={idx}
            currentIndex={currentStageIdx}
            onSelect={onSelect}
          />
        ))}
      </div>
      <p className="mt-6 text-[11px] text-zinc-300 flex items-center gap-1">
        <MdInfoOutline />
        Click any stage to jump directly to it.
      </p>
    </div>
  );
}