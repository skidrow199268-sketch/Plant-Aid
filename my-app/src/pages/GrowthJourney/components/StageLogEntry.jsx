
import {
  MdCheckCircle,
} from 'react-icons/md';


import {
  formatTimestamp,
} from '../services/GrowthJourneyService';




export default function StageLogEntry({ log, index }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
        <MdCheckCircle className="text-emerald-500 text-xs" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-800">{log.stage}</p>
        {log.note && <p className="text-xs text-zinc-400 mt-0.5 italic">"{log.note}"</p>}
        <p className="text-[10px] text-zinc-300 mt-0.5">{formatTimestamp(log.loggedAt)}</p>
      </div>
    </div>
  );
}