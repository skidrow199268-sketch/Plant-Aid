// PlantAnalysisCard.jsx
// Displays the Gemini-generated botanical analysis.
// Drop this component inside DiagnosticScan.jsx results section.
//
// USAGE in DiagnosticScan.jsx:
//   import { PlantAnalysisCard } from './PlantAnalysisCard';
//   <PlantAnalysisCard analysis={analysis} loading={analysisLoading} error={analysisError} />
//
// CHANGED (classification feature): added a Classification block
// (Plant Type / Category / Family / Genus) right after the overview,
// before the Care Guide grid.

import React, { useState } from 'react';
import { getDifficultyConfig } from '../services/PlantAnalysis';

// React Icons
import {
  MdWaterDrop,
  MdWbSunny,
  MdGrass,
  MdScience,
  MdBugReport,
  MdLocalHospital,
  MdNature,
  MdTimer,
  MdShoppingBasket,
  MdPeople,
  MdWarning,
  MdThermostat,
  MdLightbulb,
  MdSpa,
  MdExpandMore,
  MdExpandLess,
  MdAutoAwesome,
  MdCategory,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { FaSeedling } from 'react-icons/fa6';
import {Pill,InfoRow,AnalysisSection,AnalysisSkeleton} from './index'

// ─────────────────────────────────────────────────────────────
export function PlantAnalysisCard({ analysis, loading, error }) {

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-[#1b6b51]">
          <MdAutoAwesome className="text-lg animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Gemini is analysing your plant…</span>
        </div>
        <AnalysisSkeleton />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-red-50 border border-red-100 rounded-3xl p-5 flex items-start gap-3">
        <MdWarning className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800">Analysis unavailable</p>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  // ── No analysis yet ──────────────────────────────────────
  if (!analysis) return null;

  const diffCfg  = getDifficultyConfig(analysis.careDifficulty);
  const isToxic  = analysis.toxicity?.istoxic;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">

      {/* Header badge */}
      <div className="flex items-center gap-2 text-[#1b6b51]">
        <MdAutoAwesome className="text-lg" />
        <span className="text-xs font-bold uppercase tracking-widest">Gemini Botanical Analysis</span>
      </div>

      {/* Overview card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-zinc-900/20 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-xl font-extrabold text-black dark:text-white leading-tight">
              {analysis.commonName}
            </h3>
            <p className="text-xs italic text-[#47464a] mt-0.5">{analysis.scientificName}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${diffCfg.bg} ${diffCfg.text} ${diffCfg.border}`}>
              {analysis.careDifficulty || 'Moderate'}
            </span>
            {analysis.gardeningMethod && (
              <span className="px-3 py-1 rounded-full border border-[#a6f2d1] bg-[#a6f2d1]/30 text-[#237157] text-xs font-bold">
                {analysis.gardeningMethod}
              </span>
            )}
          </div>
        </div>

        {/* Overview text */}
        {analysis.overview && (
          <p className="text-sm text-[#47464a] leading-relaxed">{analysis.overview}</p>
        )}

        {/* Quick tips row */}
        {analysis.quickTips?.length > 0 && (
          <div className="bg-[#a6f2d1]/10 border border-[#a6f2d1]/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[#1b6b51] mb-2">
              <MdLightbulb className="text-base" />
              <span className="text-xs font-bold uppercase tracking-widest">Quick Tips</span>
            </div>
            <ul className="space-y-1.5">
              {analysis.quickTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#1a1b22]">
                  <IoLeaf className="text-[#1b6b51] flex-shrink-0 mt-0.5 text-sm" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* NEW: Classification card — Plant Type / Category / Family / Genus */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-zinc-900/20 space-y-3">
        <div className="flex items-center gap-2 text-[#1b6b51]">
          <MdCategory className="text-lg" />
          <span className="text-xs font-bold uppercase tracking-widest">Classification</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
            <p className="text-[10px] font-bold text-[#47464a] uppercase tracking-widest mb-1">Plant Type</p>
            <p className="text-sm font-bold text-black dark:text-white">{analysis.plantType || 'Unknown'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
            <p className="text-[10px] font-bold text-[#47464a] uppercase tracking-widest mb-1">Category</p>
            <p className="text-sm font-bold text-black dark:text-white">{analysis.category || 'Unknown'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
            <p className="text-[10px] font-bold text-[#47464a] uppercase tracking-widest mb-1">Family</p>
            <p className="text-sm font-bold italic text-black dark:text-white">{analysis.family || 'Unknown'}</p>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
            <p className="text-[10px] font-bold text-[#47464a] uppercase tracking-widest mb-1">Genus</p>
            <p className="text-sm font-bold italic text-black dark:text-white">{analysis.genus || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Care guide grid — 2 columns on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Watering */}
        <AnalysisSection icon={MdWaterDrop} title="Watering Guide" iconBg="bg-sky-50" iconColor="text-sky-600">
          <div className="space-y-1">
            <InfoRow label="Frequency"  value={analysis.wateringGuide?.frequency} />
            <InfoRow label="Amount"     value={analysis.wateringGuide?.amount}    />
            {analysis.wateringGuide?.tips && (
              <p className="text-xs text-[#47464a] leading-relaxed mt-2 pt-2 border-t border-zinc-50">
                💡 {analysis.wateringGuide.tips}
              </p>
            )}
          </div>
        </AnalysisSection>

        {/* Sunlight */}
        <AnalysisSection icon={MdWbSunny} title="Sunlight Guide" iconBg="bg-amber-50" iconColor="text-amber-600">
          <div className="space-y-1">
            <InfoRow label="Requirement" value={analysis.sunlightGuide?.requirement} />
            <InfoRow label="Hours/Day"   value={analysis.sunlightGuide?.hoursPerDay} />
            {analysis.sunlightGuide?.tips && (
              <p className="text-xs text-[#47464a] leading-relaxed mt-2 pt-2 border-t border-zinc-50">
                💡 {analysis.sunlightGuide.tips}
              </p>
            )}
          </div>
        </AnalysisSection>

        {/* Soil */}
        <AnalysisSection icon={MdGrass} title="Soil Guide" iconBg="bg-lime-50" iconColor="text-lime-700">
          <div className="space-y-1">
            <InfoRow label="Type" value={analysis.soilGuide?.type} />
            <InfoRow label="pH"   value={analysis.soilGuide?.pH}   />
            {analysis.soilGuide?.tips && (
              <p className="text-xs text-[#47464a] leading-relaxed mt-2 pt-2 border-t border-zinc-50">
                💡 {analysis.soilGuide.tips}
              </p>
            )}
          </div>
        </AnalysisSection>

        {/* Fertilizing */}
        <AnalysisSection icon={MdScience} title="Fertilizing Guide" iconBg="bg-purple-50" iconColor="text-purple-600">
          <div className="space-y-1">
            <InfoRow label="Frequency" value={analysis.fertilizingGuide?.frequency} />
            <InfoRow label="Type"      value={analysis.fertilizingGuide?.type}      />
            {analysis.fertilizingGuide?.tips && (
              <p className="text-xs text-[#47464a] leading-relaxed mt-2 pt-2 border-t border-zinc-50">
                💡 {analysis.fertilizingGuide.tips}
              </p>
            )}
          </div>
        </AnalysisSection>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pests */}
        <AnalysisSection icon={MdBugReport} title="Pest Control" iconBg="bg-orange-50" iconColor="text-orange-600" defaultOpen={false}>
          {analysis.commonPests?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {analysis.commonPests.map((p, i) => (
                <Pill key={i} label={p} bg="bg-orange-50" text="text-orange-700" />
              ))}
            </div>
          )}
          {analysis.pestControl && (
            <p className="text-xs text-[#47464a] leading-relaxed">{analysis.pestControl}</p>
          )}
        </AnalysisSection>

        {/* Disease */}
        <AnalysisSection icon={MdLocalHospital} title="Disease Management" iconBg="bg-red-50" iconColor="text-red-600" defaultOpen={false}>
          {analysis.diseaseManagement && (
            <p className="text-xs text-[#47464a] leading-relaxed">{analysis.diseaseManagement}</p>
          )}
        </AnalysisSection>

        {/* Propagation */}
        <AnalysisSection icon={FaSeedling} title="Propagation" iconBg="bg-emerald-50" iconColor="text-emerald-600" defaultOpen={false}>
          {analysis.propagationMethods?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {analysis.propagationMethods.map((m, i) => (
                <Pill key={i} label={m} bg="bg-emerald-50" text="text-emerald-700" />
              ))}
            </div>
          )}
        </AnalysisSection>

        {/* Growth timeline */}
        <AnalysisSection icon={MdTimer} title="Growth Timeline" iconBg="bg-teal-50" iconColor="text-teal-600" defaultOpen={false}>
          <div className="space-y-1">
            <InfoRow label="Germination" value={analysis.growthTimeline?.germination} />
            <InfoRow label="Seedling"    value={analysis.growthTimeline?.seedling}    />
            <InfoRow label="Maturity"    value={analysis.growthTimeline?.maturity}    />
          </div>
        </AnalysisSection>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Companion plants */}
        {analysis.companionPlants?.length > 0 && (
          <AnalysisSection icon={MdNature} title="Companion Plants" iconBg="bg-[#a6f2d1]" iconColor="text-[#1b6b51]" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {analysis.companionPlants.map((p, i) => (
                <Pill key={i} label={p} bg="bg-[#a6f2d1]/30" text="text-[#237157]" />
              ))}
            </div>
          </AnalysisSection>
        )}

        {/* Climate */}
        {analysis.climateSuitability && (
          <AnalysisSection icon={MdThermostat} title="Climate Suitability" iconBg="bg-blue-50" iconColor="text-blue-600" defaultOpen={false}>
            <p className="text-xs text-[#47464a] leading-relaxed">{analysis.climateSuitability}</p>
          </AnalysisSection>
        )}

        {/* Harvest */}
        {analysis.harvestTips && (
          <AnalysisSection icon={MdShoppingBasket} title="Harvest Tips" iconBg="bg-yellow-50" iconColor="text-yellow-700" defaultOpen={false}>
            <p className="text-xs text-[#47464a] leading-relaxed">{analysis.harvestTips}</p>
          </AnalysisSection>
        )}

        {/* Toxicity */}
        <AnalysisSection
          icon={MdWarning}
          title="Toxicity"
          iconBg={isToxic ? 'bg-red-50' : 'bg-emerald-50'}
          iconColor={isToxic ? 'text-red-600' : 'text-emerald-600'}
          defaultOpen={false}
        >
          <div className="space-y-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
              isToxic ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {isToxic ? '⚠️ Toxic' : '✅ Non-toxic'}
            </div>
            {isToxic && analysis.toxicity?.toxicTo?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {analysis.toxicity.toxicTo.map((t, i) => (
                  <Pill key={i} label={t} bg="bg-red-50" text="text-red-700" />
                ))}
              </div>
            )}
            {analysis.toxicity?.details && (
              <p className="text-xs text-[#47464a] leading-relaxed">{analysis.toxicity.details}</p>
            )}
          </div>
        </AnalysisSection>
      </div>

      {/* Attribution */}
      <div className="flex items-center justify-center gap-2 text-[#47464a]/60 py-2">
        <MdAutoAwesome className="text-sm" />
        <span className="text-[10px] font-medium">Analysis powered by Google Gemini AI</span>
      </div>
    </div>
  );
}

export default PlantAnalysisCard;