import { MdWbCloudy } from 'react-icons/md';
import {WeatherDayCard} from './index'
import {weatherIcon} from '../utils/weather'
import { getSeason } from '../../DashboardToday/utils/season'
// Real 5-day forecast: today's card uses live current-weather data,
// the remaining cards come from the aggregated OWM forecast (next 4 days).
// If the forecast failed to load, later days render as placeholders (no fake data).
export default function WeatherForecast({ weather, forecast, weatherLoading }) {
  const season = getSeason(weather);

  // Upcoming days start after today (forecast[0] is today; OWM free tier gives 5).
  const todayKey = new Date().toDateString();
  const upcomingDays = (forecast ?? [])
    .filter((f) => f.key !== todayKey)
    .slice(0, 4);

  const forecastCards = [];

  if (weather) {
    forecastCards.push({
      day:      'Today',
      Icon:     weatherIcon(weather.icon),
      temp:     String(weather.temp),
      humidity: `${weather.humidity}%`,
      isActive: true,
    });
  }

  upcomingDays.forEach((f) => {
    forecastCards.push({
      day:      f.day,
      Icon:     weatherIcon(f.icon),
      temp:     String(f.max),
      humidity: `${f.humidity}%`,
      isActive: false,
    });
  });

  // Keep the 5-column grid filled even while loading / after a failure.
  while (forecastCards.length < 5 && !upcomingDays.length) {
    forecastCards.push({ day: '…', Icon: null, temp: '–', humidity: '–', isActive: false });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-[#c8c5ca]/50 dark:border-zinc-700/50 rounded-3xl p-4 sm:p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-zinc-900/20">
      <div className="flex justify-between items-start mb-4 sm:mb-6 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-xl font-bold text-black dark:text-white">Meteorological Forecast</h2>
            {season && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#a6f2d1]/40 text-[#1b6b51]">
                {season.label}
              </span>
            )}
          </div>
          <p className="text-[#47464a] text-xs sm:text-sm mt-0.5 truncate">
            {weatherLoading
              ? 'Fetching location data…'
              : weather
                ? `${weather.cityName} · ${weather.description} · Feels ${weather.feelsLike}°C`
                : 'Precision monitoring for your location'
            }
          </p>
        </div>
        {weatherLoading
          ? <span className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#1b6b51]/30 border-t-[#1b6b51] rounded-full animate-spin flex-shrink-0" />
          : <MdWbCloudy className="text-[#1b6b51] text-2xl sm:text-3xl flex-shrink-0" />
        }
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {forecastCards.map((data, i) => (
          <WeatherDayCard
            key={i}
            day={data.day}
            Icon={data.Icon}
            temp={data.temp}
            humidity={data.humidity}
            isActive={data.isActive}
          />
        ))}
      </div>
    </div>
  );
}