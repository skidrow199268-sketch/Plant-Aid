
import * as Md from 'react-icons/md';
export default function StatCards({ stats, pendingCount, navigate }) {
  const cards = [
    {
      value: stats.totalPlants,
      label: 'Plants',
      sub: stats.totalPlants === 0 ? 'Add your first' : `${stats.healthyCount ?? 0} healthy`,
      icon: Md.MdLocalFlorist,
      iconBg: 'bg-[#a6f2d1]',
      iconColor: 'text-[#237157]',
      trend: stats.totalPlants > 0 ? 'up' : null,
      path: '/collection',
    },
    {
      value: `${stats.healthScorePct}%`,
      label: 'Health Score',
      sub: stats.healthScorePct === 100 ? 'Excellent' : stats.warningCount > 0 ? `${stats.warningCount} need attention` : `${stats.sickCount} sick`,
      icon: Md.MdFavoriteBorder,
      iconBg: 'bg-[#e3e1ec]',
      iconColor: 'text-black',
      trend: stats.healthScorePct >= 80 ? 'up' : null,
      path: '/reports',
    },
    {
      value: pendingCount,
      label: 'Tasks Pending',
      sub: pendingCount === 0 ? 'All done today!' : `${pendingCount} remaining`,
      icon: Md.MdWaterDrop,
      iconBg: pendingCount > 0 ? 'bg-[#ffdad6]' : 'bg-[#a6f2d1]',
      iconColor: pendingCount > 0 ? 'text-[#ba1a1a]' : 'text-[#237157]',
      trend: pendingCount === 0 ? 'up' : null,
      error: pendingCount > 0,
      path: '/reminders',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.label}
            onClick={() => navigate(c.path)}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-3 sm:p-4 text-left hover:border-[#1b6b51]/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.iconBg} ${c.iconColor}`}>
                <Icon className="text-sm" />
              </div>
              {c.trend && <Md.MdTrendingUp className="text-sm text-[#1b6b51]" />}
              {c.error && <Md.MdPriorityHigh className="text-sm text-[#ba1a1a]" />}
            </div>
            <p className="text-2xl font-extrabold text-[#1a1b22] tracking-tight leading-none mb-0.5">{c.value}</p>
            <p className="text-xs font-semibold text-[#47464a]">{c.label}</p>
            <p className={`text-[11px] mt-1 ${c.error ? 'text-[#ba1a1a]' : 'text-[#47464a]/60'}`}>{c.sub}</p>
          </button>
        );
      })}
    </div>
  );
}
