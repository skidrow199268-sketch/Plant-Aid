


export default function StatBar({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total',     value: stats.total,     color: 'text-black'        },
        { label: 'Pending',   value: stats.pending,   color: 'text-amber-600'    },
        { label: 'Completed', value: stats.completed, color: 'text-[#1b6b51]'   },
        { label: 'Overdue',   value: stats.overdue,   color: 'text-red-500'      },
      ].map((s) => (
        <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 px-4 py-3 text-center shadow-[0_4px_16px_rgba(0,0,0,0.02)] dark:shadow-zinc-900/20">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-[#47464a] mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}