import {
  MdEditNote,
  MdAutoAwesome,
  MdWbSunny,
  MdThermostat,
  MdOpacity,
  MdSpa,
  MdCalendarToday,
  MdTimeline,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import {
  formatDate,
  sunlightLabel,
  daysSincePlanted,
} from '../services/PlantDetailService';

import {PlantPlaceholder} from './index'

export default function ProgressView({ masterPlant, userPlant, journals }) {
  const days        = daysSincePlanted(userPlant?.plantedDate);
  const growthDays  = masterPlant?.growthDays || 90;

  // Progress = combination of days elapsed + journal activity bonus
  // Each journal entry = 1 bonus day (max 20% bonus)
  const journalCount   = journals?.length ?? 0;
  const journalBonus   = Math.min(journalCount * 2, Math.round(growthDays * 0.2));
  const effectiveDays  = days + journalBonus;
  const progressPct    = Math.min(100, Math.round((effectiveDays / growthDays) * 100));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const currentMonth = new Date().getMonth();
  const bars = months.map((month, i) => ({
    month,
    value: Math.round(20 + Math.sin((i / 6) * Math.PI) * 70),
    active: i === Math.min(currentMonth, 6),
  }));
  const maxVal = Math.max(...bars.map((b) => b.value));

  const statCards = [
    {
      icon: MdOpacity,
      label: 'Watering',
      value: masterPlant?.wateringFrequency ? `Every ${masterPlant.wateringFrequency}d` : '—',
      iconColor: 'text-[#3F6B4A]',
      bg: 'bg-[#3F6B4A]/10',
    },
    {
      icon: MdWbSunny,
      label: 'Sunlight',
      value: masterPlant?.sunlight ? sunlightLabel(masterPlant.sunlight) : '—',
      iconColor: 'text-[#A9812F]',
      bg: 'bg-[#A9812F]/10',
    },
    {
      icon: MdThermostat,
      label: 'Fertilize',
      value: masterPlant?.fertilizerFrequency ? `Every ${masterPlant.fertilizerFrequency}d` : '—',
      iconColor: 'text-[#3F6B4A]',
      bg: 'bg-[#3F6B4A]/10',
    },
    {
      icon: MdTimeline,
      label: 'Maturity',
      value: masterPlant?.growthDays ? `${masterPlant.growthDays} days` : '—',
      iconColor: 'text-[#6E7568]',
      bg: 'bg-[#6E7568]/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Progress + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Growth Progress Card */}
        <div className="bg-white border border-[#E4E1D3] rounded-md p-6 flex flex-col gap-5">

          {/* Top: percentage */}
          <div>
            <p className="text-xs font-bold text-[#6E7568] uppercase tracking-widest font-mono mb-2">Growth Progress</p>
            <p className="text-4xl font-serif font-semibold text-[#212B22] tracking-tight">
              {journalCount === 0 && days === 0 ? 'Day 1' : `${progressPct}%`}
            </p>
            <p className="text-xs text-[#6E7568] mt-1 font-mono">
              {journalCount === 0 && days === 0
                ? 'Add journal entries to track progress'
                : `${days} days · ${journalCount} log${journalCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-1.5 w-full bg-[#E4E1D3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3F6B4A] rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progressPct, journalCount > 0 ? 2 : 0)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-[#6E7568] font-mono uppercase tracking-widest">Planted</span>
              <span className="text-[10px] text-[#6E7568] font-mono uppercase tracking-widest">Mature</span>
            </div>
          </div>

          {/* Journal bonus indicator */}
          {journalCount > 0 && (
            <div className="flex items-center gap-2 bg-[#3F6B4A]/10 border border-[#3F6B4A]/20 rounded-sm px-3 py-2">
              <MdEditNote className="text-[#3F6B4A] text-sm flex-shrink-0" />
              <span className="text-xs font-semibold text-[#3F6B4A]">
                +{journalBonus} days from {journalCount} log{journalCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Planted date */}
          <div className="flex items-center gap-2 bg-[#F5F6F0] border border-[#E4E1D3] rounded-sm px-3 py-2">
            <MdCalendarToday className="text-[#3F6B4A] text-sm flex-shrink-0" />
            <span className="text-xs font-semibold text-[#6E7568] font-mono">
              Planted {formatDate(userPlant?.plantedDate)}
            </span>
          </div>
        </div>

        {/* Growth Trajectory Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E4E1D3] rounded-md p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-bold text-[#6E7568] uppercase tracking-widest font-mono mb-1">Growth Trajectory</p>
              <p className="text-lg font-serif font-semibold text-[#212B22] tracking-tight">Monthly Overview</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#6E7568] font-mono uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3F6B4A] inline-block" />
                This month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3F6B4A]/25 inline-block" />
                Previous
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-36">
            {bars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-[9px] font-mono font-bold ${bar.active ? 'text-[#3F6B4A]' : 'text-transparent'}`}>
                  {bar.value}%
                </span>
                <div className="w-full flex items-end" style={{ height: '88px' }}>
                  <div
                    className={`w-full rounded-sm transition-all duration-500 ${
                      bar.active ? 'bg-[#3F6B4A]' : 'bg-[#3F6B4A]/15 hover:bg-[#3F6B4A]/35'
                    }`}
                    style={{ height: `${(bar.value / maxVal) * 100}%` }}
                  />
                </div>
                <span className={`text-[9px] font-mono font-bold ${bar.active ? 'text-[#3F6B4A]' : 'text-[#6E7568]'}`}>
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, iconColor, bg }) => (
          <div key={label} className="bg-white border border-[#E4E1D3] rounded-md p-4 flex flex-col gap-3 hover:border-[#3F6B4A] transition-colors duration-150">
            <div className={`w-8 h-8 rounded-sm ${bg} flex items-center justify-center`}>
              <Icon className={`text-base ${iconColor}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#6E7568] uppercase tracking-widest font-mono">{label}</p>
              <p className="text-sm font-bold text-[#212B22] mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Care tip + Plant image row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 bg-[#212B22] text-[#F5F6F0] rounded-md p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <MdAutoAwesome className="text-[#A9812F] text-sm flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A9812F] font-mono">AI Care Tip</span>
          </div>
          <p className="text-sm font-serif font-semibold text-white tracking-tight leading-snug">
            {masterPlant?.name || 'Your Plant'} Care Guide
          </p>
          <p className="text-xs text-[#F5F6F0]/60 leading-relaxed line-clamp-3">
            {masterPlant?.description || 'Keep monitoring your plant and check back for personalised care tips!'}
          </p>
          <IoLeaf className="absolute -bottom-3 -right-3 text-[70px] text-white/5 pointer-events-none" />
        </div>

        {userPlant?.imageUrl || userPlant?.imageUrl !== undefined ? (

          <div className="relative group rounded-md overflow-hidden border border-[#E4E1D3]" style={{ height: '130px' }}>

            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={userPlant.imageUrl }
              alt={userPlant.nickname || 'Plant photo'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end">
              <span className="text-white text-[10px] font-mono">
                Planted {formatDate(userPlant.plantedDate)}
              </span>
            </div>

          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#E4E1D3] bg-[#F5F6F0] flex flex-col items-center justify-center gap-2 text-center p-4" style={{ height: '130px' }}>
            <MdSpa className="text-2xl text-[#6E7568]/50" />
            <p className="text-xs text-[#6E7568]">No photo yet</p>
          </div>
        )}
      </div>
    </div>
  );
}