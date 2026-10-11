
import {
  MdCheckCircle,
  MdWarning,
  MdArrowForward,
  
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import {
 
  formatConfidence,
  
} from '../pages/DiagnosticScan/services/Diagnostic';


export default function QuickResult({ preview, topMatch, confidence, healthCfg, result, onRetry, onViewDetails }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
          <img
            src={topMatch?.imageUrl || preview}
            alt={topMatch?.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#47464a] font-medium uppercase tracking-widest mb-0.5">Top Match</p>
          <h3
            className="text-base font-extrabold text-black dark:text-white leading-tight truncate"
           
          >
            {topMatch?.commonNames?.[0] || topMatch?.name || 'Unknown Plant'}
          </h3>
          {topMatch?.name && (
            <p className="text-xs italic text-[#47464a] truncate">{topMatch.name}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-lg font-extrabold text-[#1b6b51]">{confidence}%</span>
          <p className="text-[10px] text-[#47464a]">confidence</p>
        </div>
      </div>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${healthCfg.bg} ${healthCfg.border}`}>
        {result.isHealthy
          ? <MdCheckCircle className={`text-xl flex-shrink-0 ${healthCfg.text}`} />
          : <MdWarning     className={`text-xl flex-shrink-0 ${healthCfg.text}`} />
        }
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${healthCfg.text}`}>{healthCfg.label}</p>
          {result.diseases?.length > 0 && (
            <p className={`text-xs ${healthCfg.text} opacity-70 truncate`}>
              {result.diseases[0]?.commonNames?.[0] || result.diseases[0]?.name}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold ${healthCfg.text} flex-shrink-0`}>
          {formatConfidence(result.isHealthyScore)}
        </span>
      </div>

      {result.suggestions.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 px-4 py-3">
          <p className="text-[10px] font-bold text-[#47464a] uppercase tracking-widest mb-2">
            Other possibilities
          </p>
          <div className="flex flex-col gap-1.5">
            {result.suggestions.slice(1, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <IoLeaf className="text-[#1b6b51] text-xs flex-shrink-0" />
                  <span className="text-xs text-black truncate">
                    {s.commonNames?.[0] || s.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#47464a] flex-shrink-0">
                  {Math.round(s.probability * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-1">
        <button
          onClick={onRetry}
          className="flex-1 h-11 border border-[#c8c5ca] rounded-xl text-sm font-semibold text-[#47464a] hover:bg-[#e8e7f1] transition-colors"
        >
          Scan Again
        </button>
        <button
          onClick={onViewDetails}
          className="flex-1 h-11 bg-[#1b6b51] text-white rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all active:scale-95"
         
        >
          View Full Details
          <MdArrowForward className="text-base" />
        </button>
      </div>
    </div>
  );
}