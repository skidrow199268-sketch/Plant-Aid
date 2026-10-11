
import { MdWarning, MdHistory, MdOutlineHealthAndSafety, MdBiotech,} from 'react-icons/md';


export default function StatsStrip({ stats }) {
  const items = [
    {
      label: 'Total Scans',
      value: stats.total,
      Icon:  MdHistory,
      color: 'text-black',
      bg:    'bg-[#eeedf7]',
    },
    {
      label: 'Healthy',
      value: stats.healthy,
      Icon:  MdOutlineHealthAndSafety,
      color: 'text-[#237157]',
      bg:    'bg-[#a6f2d1]',
    },
    {
      label: 'Diseased',
      value: stats.diseased,
      Icon:  MdWarning,
      color: 'text-red-600',
      bg:    'bg-red-100',
    },
    {
      label: 'Identified',
      value: stats.unknown,
      Icon:  MdBiotech,
      color: 'text-[#1b6b51]',
      bg:    'bg-[#f4f2fd]',
    },
  ];

  return (
    <div className="bg-white border border-[#c8c5ca]/60 rounded-[28px] mb-8 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.06)] grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#eeedf7] overflow-hidden">
      {items.map(({ label, value, Icon, color, bg }) => (
        <div
          key={label}
          className="flex items-center gap-3 p-5"
        >
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon className={`text-xl ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold text-black leading-none tracking-tight">{value}</p>
            <p className="text-xs text-[#47464a] font-medium mt-1 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}