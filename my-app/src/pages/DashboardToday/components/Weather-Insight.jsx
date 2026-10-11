import  { useState, useEffect, useCallback } from 'react';


import {
  fetchWeather,
  getUserLocation,
  getBotanicalInsight,
} from '../services/DashboardServices.js';
import { getSeason } from '../utils/season';

import {
  MdSunny,
  MdRefresh,
} from 'react-icons/md';
import { WiCloud, WiDaySunny, WiRain, WiHumidity, WiStrongWind } from 'react-icons/wi';




export default function WeatherInsight() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = await getUserLocation();
      const data = await fetchWeather(lat, lon);
      setWeather(data);
    } catch (err) {
      console.error('Weather load error:', err);
      setError('Could not load weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const WeatherIcon = () => {
    if (!weather)         return <WiCloud    className="text-[80px] text-zinc-300"  />;
    if (weather.isRainy)  return <WiRain     className="text-[80px] text-sky-400"   />;
    if (weather.isSunny)  return <WiDaySunny className="text-[80px] text-amber-400" />;
    return <WiCloud className="text-[80px] text-zinc-400" />;
  };

  const season = getSeason(weather);

  return (
    <section className="col-span-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-6 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-100 dark:hover:shadow-zinc-900/30">
      <div className="absolute top-0 right-0 p-6 opacity-[0.04] pointer-events-none select-none">
        <WiCloud className="text-[160px]" />
      </div>

      <div className="flex-1 space-y-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700">
            <WiDaySunny className="text-2xl" />
            <span className="text-xs font-bold uppercase tracking-widest">Climate Forecast</span>
            {season && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {season.label}
              </span>
            )}
          </div>
          <button onClick={load} className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors" title="Refresh weather">
            <MdRefresh className={`text-zinc-400 text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-14 w-40 bg-zinc-100 rounded-2xl animate-pulse" />
            <div className="h-4 w-56 bg-zinc-100 rounded-full animate-pulse" />
            <div className="h-16 w-full max-w-xl bg-zinc-100 rounded-2xl animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
        ) : weather ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-extrabold text-zinc-900 tracking-tight">{weather.temp}°</span>
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-zinc-500 capitalize">{weather.description}</p>
                <p className="text-sm text-zinc-400">{weather.cityName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <WiHumidity className="text-sky-500 text-lg" />
                <span>{weather.humidity}% humidity</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <WiStrongWind className="text-teal-500 text-lg" />
                <span>{weather.wind} m/s wind</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                <MdSunny className="text-amber-400" />
                <span>Feels like {weather.feelsLike}°C</span>
              </div>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl max-w-xl">
              <p className="text-sm text-emerald-900 leading-relaxed">
                <strong className="font-bold">Botanical Insight:</strong>{' '}
                {getBotanicalInsight(weather)}
              </p>
            </div>
          </>
        ) : null}
      </div>

      <div className="w-full md:w-72 h-48 rounded-2xl overflow-hidden relative group shrink-0">
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
          <WeatherIcon />
        </div>
      </div>
    </section>
  );
}
