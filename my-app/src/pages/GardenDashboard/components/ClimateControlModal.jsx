import { useState, useEffect, } from 'react';
import * as Md from 'react-icons/md';
import {
  fetchWeather,
  getUserLocation,
  getBotanicalInsight,
} from '../../DashboardToday/services/DashboardServices.js';
import { getSeason, getSeasonalTip } from '../../DashboardToday/utils/season';



export default function ClimateControlModal({ onClose }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const location = await getUserLocation();
        const w = await fetchWeather(location.lat, location.lon, location.name, location.country);
        setWeather(w);
      } catch (err) {
        console.error('ClimateControlModal weather error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getConditionLabel = (w) => {
    if (!w) return '—';
    if (w.humidity > 80) return 'High Humidity';
    if (w.humidity < 40) return 'Low Humidity';
    if (w.temp > 35)     return 'Heat Stress Risk';
    if (w.temp < 15)     return 'Cold Stress Risk';
    return 'Optimal Range';
  };

  const getConditionColor = (w) => {
    if (!w) return 'text-zinc-400';
    if (w.humidity > 80 || w.humidity < 40 || w.temp > 35 || w.temp < 15) return 'text-amber-400';
    return 'text-[#a6f2d1]';
  };

  const insight = weather ? getBotanicalInsight(weather) : null;
  const season = weather ? getSeason(weather) : null;
  const seasonTip = weather ? getSeasonalTip(weather) : '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0f0f0f] rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'fadeUp 0.28s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-black px-6 pt-6 pb-8 overflow-hidden">
          <Md.MdThermostat className="absolute -bottom-4 -right-3 text-[140px] text-white/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Md.MdThermostat className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">Climate Control</h2>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Live Environmental Data</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors">
              <Md.MdClose />
            </button>
          </div>

          {loading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="flex-1 h-16 bg-white/10 rounded-2xl" />
              <div className="flex-1 h-16 bg-white/10 rounded-2xl" />
              <div className="flex-1 h-16 bg-white/10 rounded-2xl" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-2xl px-4 py-3">⚠️ Could not fetch weather data.</p>
          ) : (
            <div className="flex items-stretch gap-3">
              <div className="flex-1 bg-white/5 rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  {weather.isSunny ? <Md.MdWbSunny className="text-amber-400 text-sm" /> : weather.isRainy ? <Md.MdUmbrella className="text-sky-400 text-sm" /> : <Md.MdCloud className="text-zinc-400 text-sm" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Temp</span>
                </div>
                <p className="text-3xl font-extrabold text-white tracking-tight">{weather.temp}°</p>
                <p className="text-[10px] text-white/30 font-medium">Celsius</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Md.MdWaterDrop className="text-sky-400 text-sm" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Humidity</span>
                </div>
                <p className="text-3xl font-extrabold text-white tracking-tight">{weather.humidity}%</p>
                <p className="text-[10px] text-white/30 font-medium">Relative</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Md.MdAir className="text-teal-400 text-sm" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Wind</span>
                </div>
                <p className="text-3xl font-extrabold text-white tracking-tight">{weather.wind}</p>
                <p className="text-[10px] text-white/30 font-medium">m/s</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {!loading && !error && weather && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Md.MdLocationOn className="text-sm text-white/30" />
                <span className="capitalize">{weather.cityName}</span>
                <span>·</span>
                <span className="capitalize">{weather.description}</span>
              </div>
              <span className={`text-xs font-bold ${getConditionColor(weather)}`}>{getConditionLabel(weather)}</span>
            </div>
          )}
          {!loading && !error && insight && (
            <div className="bg-[#1b6b51]/20 border border-[#1b6b51]/30 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#a6f2d1] mb-1">🌿 Botanical Insight</p>
              <p className="text-xs text-white/70 leading-relaxed">{insight}</p>
            </div>
          )}
          {!loading && !error && season && seasonTip && (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">🗓️ {season.label} Care Tip</p>
              <p className="text-xs text-white/60 leading-relaxed">{seasonTip}</p>
            </div>
          )}
          {!loading && !error && weather && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Today's Care Tips</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 ${weather.isRainy ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-white/5'}`}>
                  <Md.MdWaterDrop className={`text-base flex-shrink-0 ${weather.isRainy ? 'text-sky-400' : 'text-white/20'}`} />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">Watering</p>
                    <p className="text-[11px] text-white/40">{weather.isRainy ? 'Skip — rain today' : weather.humidity > 70 ? 'Reduce frequency' : 'Water as normal'}</p>
                  </div>
                </div>
                <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 ${weather.isSunny ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'}`}>
                  <Md.MdWbSunny className={`text-base flex-shrink-0 ${weather.isSunny ? 'text-amber-400' : 'text-white/20'}`} />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">Sunlight</p>
                    <p className="text-[11px] text-white/40">{weather.isSunny ? 'Great light today' : 'Move to bright spot'}</p>
                  </div>
                </div>
                <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 ${weather.temp > 30 ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
                  <Md.MdThermostat className={`text-base flex-shrink-0 ${weather.temp > 30 ? 'text-red-400' : 'text-white/20'}`} />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">Temperature</p>
                    <p className="text-[11px] text-white/40">{weather.temp > 35 ? 'Heat stress risk' : weather.temp > 30 ? 'Keep shaded' : weather.temp < 15 ? 'Bring indoors' : 'All good'}</p>
                  </div>
                </div>
                <div className="rounded-xl px-3 py-2.5 flex items-center gap-2 bg-white/5">
                  <Md.MdAir className="text-teal-400 text-base flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-white/60">Airflow</p>
                    <p className="text-[11px] text-white/40">{weather.wind > 8 ? 'High wind — secure pots' : 'Good circulation'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <button onClick={onClose} className="w-full mt-1 py-3 rounded-2xl bg-white/10 text-white text-sm font-bold hover:bg-white/15 transition-colors">
            Close
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
