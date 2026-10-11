
import {
  MdEco,
  MdOutlineWaterDrop,
} from 'react-icons/md';

import {StageLogEntry} from './index'

export default function StageHistoryPanel({ stageLogs }) {
  return (
    <div className="lg:col-span-2 p-6 bg-white border border-zinc-200/60 rounded-3xl shadow-sm flex flex-col">
      <h3 className="text-sm font-bold text-zinc-800 mb-5 uppercase tracking-widest flex items-center gap-2">
        <MdOutlineWaterDrop className="text-[#064e3b]" />
        Stage History
      </h3>
      {stageLogs.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-8 gap-3">
          <MdEco className="text-3xl text-emerald-200" />
          <p className="text-sm text-zinc-400">No stage transitions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4 lg:overflow-y-auto lg:max-h-80 pr-1 [scrollbar-width:thin]">
          {stageLogs.map((log, i) => (
            <StageLogEntry key={log.id ?? i} log={log} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}