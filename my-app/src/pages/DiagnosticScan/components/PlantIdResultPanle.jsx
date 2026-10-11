import  { useState,  } from 'react';

import {
  formatConfidence,
  getHealthConfig,
} from '../services/Diagnostic';
import { ConfidenceBar,PlantAnalysisCard } from '../components/index';
import {
  MdCheckCircle,
  MdWarning,
  MdLocalFlorist,
  MdBiotech,
  MdOpenInNew,
  MdRefresh,
  MdAutoAwesome,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';



export default function PlantIdResultPanel({ result, preview, onRetry, analysis, analysisLoading, analysisError }) {
  const [activeTab, setActiveTab] = useState('identification');
  const healthCfg = getHealthConfig(result.isHealthy, result.isHealthyScore);
  const topMatch  = result.suggestions[0];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-zinc-900/20">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {preview && (
            <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0">
              <img src={preview} alt="Scanned plant" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-bold text-[#47464a] uppercase tracking-widest mb-1">Top Match</p>
                <h2 className="text-2xl font-extrabold text-black dark:text-white tracking-tight leading-tight">
                  {topMatch?.commonNames?.[0] || topMatch?.name || 'Unknown Plant'}
                </h2>
                {topMatch?.name && <p className="text-sm italic text-[#47464a] mt-0.5">{topMatch.name}</p>}
              </div>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold flex-shrink-0 ${healthCfg.bg} ${healthCfg.text} ${healthCfg.border}`}>
                {result.isHealthy ? <MdCheckCircle className="text-sm" /> : <MdWarning className="text-sm" />}
                {healthCfg.label}
              </span>
            </div>
            <div>
              <p className="text-xs text-[#47464a] mb-1.5">Identification confidence</p>
              <ConfidenceBar value={topMatch?.probability ?? 0} />
            </div>
            {topMatch?.wikiUrl && (
              <a href={topMatch.wikiUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b6b51] hover:opacity-75">
                <MdOpenInNew className="text-sm" /> View on Wikipedia
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { key: 'identification', label: 'Identification',    icon: MdLocalFlorist },
          { key: 'health',         label: 'Health Assessment', icon: MdBiotech       },
          { key: 'analysis',       label: 'AI Analysis',   icon: MdAutoAwesome   },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === key ? 'bg-black text-white' : 'bg-white text-[#47464a] border border-[#c8c5ca]/60 hover:border-[#1b6b51]/40'
            }`}>
            <Icon className="text-base" /> {label}
            {key === 'analysis' && analysisLoading && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin ml-1" />
            )}
          </button>
        ))}
        <button onClick={onRetry}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[#47464a] border border-[#c8c5ca]/60 hover:border-[#1b6b51]/40 whitespace-nowrap">
          <MdRefresh className="text-base" /> Scan Again
        </button>
      </div>

      {/* Identification tab */}
      {activeTab === 'identification' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-6 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-zinc-900/20\">
          <h3 className="text-base font-bold text-black dark:text-white">All Suggestions</h3>
          {result.suggestions.length === 0
            ? <p className="text-sm text-[#47464a]">No species suggestions returned.</p>
            : (
              <div className="space-y-4">
                {result.suggestions.map((s, i) => (
                  <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    i === 0 ? 'border-[#1b6b51]/30 bg-[#a6f2d1]/10' : 'border-[#c8c5ca]/30 hover:border-[#c8c5ca]/60'
                  }`}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                      {s.imageUrl
                        ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><IoLeaf className="text-xl text-zinc-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-black leading-tight">{s.commonNames?.[0] || s.name}</p>
                          <p className="text-xs italic text-[#47464a]">{s.name}</p>
                        </div>
                        {i === 0 && (
                          <span className="text-[10px] font-bold text-[#1b6b51] bg-[#a6f2d1] px-2 py-0.5 rounded-full flex-shrink-0">
                            BEST MATCH
                          </span>
                        )}
                      </div>
                      <ConfidenceBar value={s.probability} />
                      {s.description && <p className="text-xs text-[#47464a] leading-relaxed line-clamp-2">{s.description}</p>}
                      {s.commonNames?.length > 1 && (
                        <p className="text-[11px] text-[#47464a]">Also known as: {s.commonNames.slice(1, 4).join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Health tab */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-3xl border border-[#c8c5ca]/40 p-6 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${healthCfg.bg} ${healthCfg.border}`}>
            {result.isHealthy
              ? <MdCheckCircle className={`text-2xl ${healthCfg.text}`} />
              : <MdWarning     className={`text-2xl ${healthCfg.text}`} />
            }
            <div>
              <p className={`text-sm font-bold ${healthCfg.text}`}>Overall: {healthCfg.label}</p>
              <p className={`text-xs ${healthCfg.text} opacity-70`}>{formatConfidence(result.isHealthyScore)} healthy probability</p>
            </div>
          </div>

          {result.diseases.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center gap-3">
              <MdCheckCircle className="text-4xl text-emerald-400" />
              <p className="text-sm font-bold text-zinc-800">No issues detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-black">Detected Conditions</h3>
              {result.diseases.map((d, i) => (
                <div key={i} className="p-4 rounded-2xl border border-red-100 bg-red-50/40 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-bold text-red-900">{d.commonNames?.[0] || d.name}</p>
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                      {formatConfidence(d.probability)}
                    </span>
                  </div>
                  <ConfidenceBar value={d.probability} />
                  {d.description && <p className="text-xs text-red-800 leading-relaxed line-clamp-3">{d.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gemini Analysis tab */}
      {activeTab === 'analysis' && (
        <PlantAnalysisCard
          analysis={analysis}
          loading={analysisLoading}
          error={analysisError}
        />
      )}
    </div>
  );
}
