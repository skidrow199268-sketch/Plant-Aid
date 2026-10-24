import { useState, useEffect, useCallback } from 'react';

import {
  fetchWeather,
  fetchForecast,
  getUserLocation,
  getBotanicalInsight,
} from '../services/DashboardServices.js';
import { getSeason } from '../utils/season';
import { weatherIcon } from '../../Setting/utils/weather';

import { MdLocationOn, MdRefresh, MdSunny } from 'react-icons/md';
import {
  WiCloud,
  WiDaySunny,
  WiNightClear,
  WiDayCloudy,
  WiNightAltCloudy,
  WiCloudy,
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiHumidity,
  WiStrongWind,
  WiThermometer,
} from 'react-icons/wi';

// ─────────────────────────────────────────────────────────────
// Helpers — pick an accurate icon from the OWM code instead of
// the broad isSunny flag (800+ includes overcast clouds).
// ─────────────────────────────────────────────────────────────

function heroIcon(code) {
  const id = (code ?? '01d').slice(0, 2);
  const night = (code ?? 'd').endsWith('n');
  if (id === '01') return night ? WiNightClear : WiDaySunny;
  if (id === '02' || id === '03') return night ? WiNightAltCloudy : WiDayCloudy;
  if (id === '04') return WiCloudy;
  if (id === '09' || id === '10') return WiRain;
  if (id === '11') return WiThunderstorm;
  if (id === '13') return WiSnow;
  if (id === '50') return WiFog;
  return WiCloudy;
}

function iconTone(code) {
  const id = (code ?? '01').slice(0, 2);
  if (id === '01') return 'text-amber-400';
  if (id === '09' || id === '10' || id === '11') return 'text-sky-500';
  if (id === '13') return 'text-sky-300';
  return 'text-zinc-400';
}

// ─────────────────────────────────────────────────────────────
// Small presentational pieces (local to this card)
// ─────────────────────────────────────────────────────────────

function ForecastTile({ day, Icon, code, max, min, active, loading }) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center rounded-2xl border px-1 py-2.5 sm:px-2 sm:py-3 transition-colors ${
        active
          ? 'border-transparent bg-zinc-900 text-white shadow-md shadow-zinc-900/20 dark:bg-white dark:text-zinc-900'
          : 'border-zinc-100 bg-zinc-50 dark:border-zinc-700/60 dark:bg-zinc-800/50'
      } ${loading ? 'animate-pulse' : ''}`}
    >
      <span
        className={`text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
          active ? 'text-white/70 dark:text-zinc-500' : 'text-zinc-400'
        }`}
      >
        {day}
      </span>

      {Icon ? (
        <Icon
          className={`my-1.5 text-xl sm:text-2xl ${
            active ? 'text-white dark:text-zinc-800' : iconTone(code)
          }`}
        />
      ) : (
        <span className="my-1.5 h-5 w-5 rounded-full bg-zinc-200 sm:h-6 sm:w-6" />
      )}

      <span className={`text-xs font-bold sm:text-sm ${
        active ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'
      }`}>
        {max != null ? `${max}°` : '–'}
      </span>
      <span className={`mt-0.5 h-3 text-[9px] font-medium ${
        active ? 'text-white/60 dark:text-zinc-500' : 'text-zinc-400'
      }`}>
        {min != null ? `${min}°` : ''}
      </span>
    </div>
  );
}

function MetricTile({ Icon, label, value, caption, loading }) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 sm:p-4 dark:border-zinc-700/60 dark:bg-zinc-800/50">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <Icon className="text-base" />
        {label}
      </div>
      {loading ? (
        <div className="mt-2 h-6 w-14 animate-pulse rounded-lg bg-zinc-200" />
      ) : (
        <>
          <p className="mt-1 text-xl font-extrabold text-zinc-900 dark:text-white">{value}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">{caption}</p>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main – dashboard weather card
// ─────────────────────────────────────────────────────────────

export default function WeatherInsight() {
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = await getUserLocation();
      // One location lookup, two calls. A forecast failure must not
      // take down current conditions, so it degrades to null.
      const [current, daily] = await Promise.all([
        fetchWeather(lat, lon),
        fetchForecast(lat, lon).catch((err) => {
          console.warn('Forecast load failed (non-fatal):', err);
          return null;
        }),
      ]);
      setWeather(current);
      setForecast(daily);
    } catch (err) {
      console.error('Weather load error:', err);
      setError('Could not load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const season   = getSeason(weather);
  const today    = forecast?.[0] ?? null;
  const weekDays = forecast?.length
    ? forecast.slice(0, 5)
    : Array.from({ length: 5 }, () => ({ day: '—', icon: null, max: null, min: null }));

  const feelsCaption = !weather
    ? ''
    : weather.feelsLike > weather.temp
      ? 'Humidity is making it feel warmer.'
      : weather.feelsLike < weather.temp
        ? 'Wind is making it feel cooler.'
        : 'Matches the actual temperature.';

  const humidityCaption = weather?.isHumid
    ? 'Great conditions for tropical plants.'
    : 'Consider misting your plants today.';

  const HeroIcon = heroIcon(weather?.icon);

  return (
    <section className="relative col-span-12 min-w-0 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-100 sm:p-6 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:shadow-zinc-900/30">
      {/* Very subtle neutral atmosphere — no color wash */}
      <WiCloud className="pointer-events-none absolute -right-4 -top-6 hidden select-none text-[160px] text-zinc-100/80 sm:block dark:text-zinc-800/40" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-1.5 text-lg font-bold text-zinc-900 dark:text-white">
              <MdSunny className="text-base text-zinc-400" />
              Climate Forecast
            </h3>
            {season && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                {season.label}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
            <MdLocationOn className="flex-shrink-0 text-sm" />
            <span className="truncate">
              {weather
                ? `${weather.cityName}${weather.country ? `, ${weather.country}` : ''}`
                : loading
                  ? 'Detecting your location…'
                  : 'Location unavailable'}
            </span>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          aria-label="Refresh weather"
          title="Refresh weather"
          className="flex-shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-60 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <MdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-1 gap-6 sm:mt-5 lg:grid-cols-12 lg:gap-8">
        {/* Current conditions */}
        <div className="min-w-0 lg:col-span-5">
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 w-36 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-40 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-56 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : weather ? (
            <>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-start">
                  <span className="text-6xl font-extrabold leading-none tracking-tight text-zinc-900 sm:text-7xl dark:text-white">
                    {weather.temp}
                  </span>
                  <span className="mt-1 text-2xl font-semibold text-zinc-400 sm:text-3xl">°</span>
                </div>

                <div className="ml-auto flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 sm:h-28 sm:w-28 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <HeroIcon className={`text-5xl sm:text-7xl ${iconTone(weather.icon)}`} />
                </div>
              </div>

              <p className="mt-1 text-base font-medium capitalize text-zinc-500 dark:text-zinc-400">
                {weather.description}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                {today && (
                  <span className="font-semibold text-zinc-500 dark:text-zinc-300">
                    H {today.max}° <span className="font-normal text-zinc-300 dark:text-zinc-600">/</span> L {today.min}°
                  </span>
                )}
                <span className="inline-flex items-center gap-0.5">
                  <WiStrongWind className="text-sm" />
                  {weather.wind} m/s
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                <MetricTile
                  Icon={WiThermometer}
                  label="Feels like"
                  value={`${weather.feelsLike}°`}
                  caption={feelsCaption}
                />
                <MetricTile
                  Icon={WiHumidity}
                  label="Humidity"
                  value={`${weather.humidity}%`}
                  caption={humidityCaption}
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Week forecast + botanical insight */}
        {!error && (
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Forecast
                </h4>
                <span className="text-[11px] text-zinc-400">
                  {forecast?.length ? `${Math.min(forecast.length, 5)}-day forecast` : 'This week'}
                </span>
              </div>

              <div className="mt-2.5 grid min-w-0 grid-cols-5 gap-1.5 sm:gap-2.5">
                {weekDays.map((day, i) => (
                  <ForecastTile
                    key={day.key ?? i}
                    day={i === 0 ? 'Today' : day.day}
                    Icon={day.icon ? weatherIcon(day.icon) : null}
                    code={day.icon}
                    max={day.max}
                    min={day.min}
                    active={i === 0}
                    loading={loading}
                  />
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ) : weather ? (
              <div className="mt-auto rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 sm:p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                <p className="text-xs leading-relaxed text-emerald-900 sm:text-sm dark:text-emerald-100/90">
                  <strong className="font-bold text-emerald-800 dark:text-emerald-300">
                    Botanical Insight:
                  </strong>{' '}
                  {getBotanicalInsight(weather)}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
