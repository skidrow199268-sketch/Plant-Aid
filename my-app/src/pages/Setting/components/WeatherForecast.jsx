import { MdCloud, MdWbSunny, MdWbCloudy } from 'react-icons/md';
import {WeatherDayCard} from './index'
import { IoRainy, IoPartlySunny } from 'react-icons/io5';
import {weatherIcon} from '../utils/weather'
import { getSeason } from '../../DashboardToday/utils/season'
export default function WeatherForecast({ weather, weatherLoading }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const todayIdx = days.findIndex((d) => d.toUpperCase() === today.toUpperCase());
  const season = getSeason(weather);

  const staticUpcoming = [
    { icon: MdCloud,       temp: '29', humidity: '25%' },
    { icon: IoRainy,       temp: '26', humidity: '80%' },
    { icon: IoPartlySunny, temp: '28', humidity: '15%' },
    { icon: MdWbSunny,     temp: '32', humidity: '5%'  },
  ];

  const forecastCards = days.map((day, i) => {
    const isToday = i === (todayIdx >= 0 ? todayIdx : 0);
    if (isToday && weather) {
      return {
        day,
        Icon:     weatherIcon(weather.icon),
        temp:     String(weather.temp),
        humidity: `${weather.humidity}%`,
        isActive: true,
      };
    }
    const upcoming = staticUpcoming[(i > (todayIdx >= 0 ? todayIdx : 0) ? i - (todayIdx >= 0 ? todayIdx : 0) : i + days.length - (todayIdx >= 0 ? todayIdx : 0)) - 1] || staticUpcoming[0];
    return { day, Icon: upcoming.icon, temp: upcoming.temp, humidity: upcoming.humidity, isActive: false };
  });

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