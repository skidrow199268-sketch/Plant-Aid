import {

  MdNotificationsActive,

} from 'react-icons/md';

import {formatDate,formatTime,reminderBadgeClass} from '../utils/reminderUtils.jsx'
import { useNavigate } from 'react-router-dom';
export default function UpcomingTasks({ upcomingReminders = [] }) {
  const navigate = useNavigate();

  return (
    <section className="col-span-12 md:col-span-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-100 dark:hover:shadow-zinc-900/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-zinc-900">Upcoming</h3>
        <button
          onClick={() => navigate('/task-management')}
          className="text-emerald-700 font-bold text-sm hover:underline transition-all"
        >
          View All
        </button>
      </div>

      {upcomingReminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center space-y-2">
          <MdNotificationsActive className="text-3xl text-zinc-200" />
          <p className="text-sm text-zinc-400">No upcoming reminders.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {upcomingReminders.map((ev) => {
            const timeStr = formatTime(ev.reminderDate);
            const [time, period] = timeStr.split(' ');
            return (
              <div key={ev.id} className="flex items-start gap-4 p-3 border-b border-zinc-100 last:border-0 last:pb-0">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${reminderBadgeClass(ev.type)}`}>
                  <span className="text-xs font-bold leading-none">{time}</span>
                  <span className="text-[10px] uppercase font-semibold mt-0.5">{period}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-800 truncate">{ev.title}</h4>
                    <span className={`hidden sm:inline text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${reminderBadgeClass(ev.type)}`}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(ev.reminderDate)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
