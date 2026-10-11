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
      iconColor: 'text-[#1b6b51]',
      bg: 'bg-[#1b6b51]/10',
    },
    {
      icon: MdWbSunny,
      label: 'Sunlight',
      value: masterPlant?.sunlight ? sunlightLabel(masterPlant.sunlight) : '—',
      iconColor: 'text-[#237157]',
      bg: 'bg-[#237157]/10',
    },
    {
      icon: MdThermostat,
      label: 'Fertilize',
      value: masterPlant?.fertilizerFrequency ? `Every ${masterPlant.fertilizerFrequency}d` : '—',
      iconColor: 'text-[#1b6b51]',
      bg: 'bg-[#1b6b51]/10',
    },
    {
      icon: MdTimeline,
      label: 'Maturity',
      value: masterPlant?.growthDays ? `${masterPlant.growthDays} days` : '—',
      iconColor: 'text-[#47464a]',
      bg: 'bg-[#47464a]/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Progress + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Growth Progress Card */}
        <div className="bg-white border border-[#c8c5ca] rounded-md p-6 flex flex-col gap-5">

          {/* Top: percentage */}
          <div>
            <p className="text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Growth Progress</p>
            <p className="text-4xl font-semibold text-[#1a1b22] tracking-tight">
              {journalCount === 0 && days === 0 ? 'Day 1' : `${progressPct}%`}
            </p>
            <p className="text-xs text-[#47464a] mt-1">
              {journalCount === 0 && days === 0
                ? 'Add journal entries to track progress'
                : `${days} days · ${journalCount} log${journalCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-1.5 w-full bg-[#c8c5ca] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1b6b51] rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progressPct, journalCount > 0 ? 2 : 0)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-[#47464a] uppercase tracking-widest">Planted</span>
              <span className="text-[10px] text-[#47464a] uppercase tracking-widest">Mature</span>
            </div>
          </div>

          {/* Journal bonus indicator */}
          {journalCount > 0 && (
            <div className="flex items-center gap-2 bg-[#1b6b51]/10 border border-[#1b6b51]/20 rounded-sm px-3 py-2">
              <MdEditNote className="text-[#1b6b51] text-sm flex-shrink-0" />
              <span className="text-xs font-semibold text-[#1b6b51]">
                +{journalBonus} days from {journalCount} log{journalCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Planted date */}
          <div className="flex items-center gap-2 bg-[#fbf8ff] border border-[#c8c5ca] rounded-sm px-3 py-2">
            <MdCalendarToday className="text-[#1b6b51] text-sm flex-shrink-0" />
            <span className="text-xs font-semibold text-[#47464a]">
              Planted {formatDate(userPlant?.plantedDate)}
            </span>
          </div>
        </div>

        {/* Growth Trajectory Chart */}
        <div className="lg:col-span-2 bg-white border border-[#c8c5ca] rounded-md p-6">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
            <div>
              <p className="text-xs font-bold text-[#47464a] uppercase tracking-widest mb-1">Growth Trajectory</p>
              <p className="text-lg font-semibold text-[#1a1b22] tracking-tight">Monthly Overview</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#47464a] uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1b6b51] inline-block" />
                This month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1b6b51]/25 inline-block" />
                Previous
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-36">
            {bars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-[9px] font-bold ${bar.active ? 'text-[#1b6b51]' : 'text-transparent'}`}>
                  {bar.value}%
                </span>
                <div className="w-full flex items-end" style={{ height: '88px' }}>
                  <div
                    className={`w-full rounded-sm transition-all duration-500 ${
                      bar.active ? 'bg-[#1b6b51]' : 'bg-[#1b6b51]/15 hover:bg-[#1b6b51]/35'
                    }`}
                    style={{ height: `${(bar.value / maxVal) * 100}%` }}
                  />
                </div>
                <span className={`text-[9px] font-bold ${bar.active ? 'text-[#1b6b51]' : 'text-[#47464a]'}`}>
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
          <div key={label} className="bg-white border border-[#c8c5ca] rounded-md p-4 flex flex-col gap-3 hover:border-[#1b6b51] transition-colors duration-150">
            <div className={`w-8 h-8 rounded-sm ${bg} flex items-center justify-center`}>
              <Icon className={`text-base ${iconColor}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#47464a] uppercase tracking-widest">{label}</p>
              <p className="text-sm font-bold text-[#1a1b22] mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Care tip + Plant image row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 bg-[#1a1b22] text-[#fbf8ff] rounded-md p-5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <MdAutoAwesome className="text-[#237157] text-sm flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#237157]">AI Care Tip</span>
          </div>
          <p className="text-sm font-semibold text-white tracking-tight leading-snug">
            {masterPlant?.name || 'Your Plant'} Care Guide
          </p>
          <p className="text-xs text-[#fbf8ff]/60 leading-relaxed line-clamp-3">
            {masterPlant?.description || 'Keep monitoring your plant and check back for personalised care tips!'}
          </p>
          <IoLeaf className="absolute -bottom-3 -right-3 text-[70px] text-white/5 pointer-events-none" />
        </div>

        {userPlant?.imageUrl || userPlant?.imageUrl !== undefined ? (

          <div className="relative group rounded-md overflow-hidden border border-[#c8c5ca]" style={{ height: '130px' }}>

            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={userPlant.imageUrl }
              alt={userPlant.nickname || 'Plant photo'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end">
              <span className="text-white text-[10px]">
                Planted {formatDate(userPlant.plantedDate)}
              </span>
            </div>

          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#c8c5ca] bg-[#fbf8ff] flex flex-col items-center justify-center gap-2 text-center p-4" style={{ height: '130px' }}>
            <MdSpa className="text-2xl text-[#47464a]/50" />
            <p className="text-xs text-[#47464a]">No photo yet</p>
          </div>
        )}
      </div>
    </div>
  );
}