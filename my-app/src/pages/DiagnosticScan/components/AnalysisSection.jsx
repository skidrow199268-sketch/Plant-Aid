import {
  MdExpandMore,
  MdExpandLess,
 
} from 'react-icons/md';
import {useState} from 'react'
export default function AnalysisSection({ icon: Icon, title, iconColor = 'text-[#1b6b51]', iconBg = 'bg-[#a6f2d1]', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className="text-base" />
          </div>
          <span className="text-sm font-bold text-black dark:text-white">
            {title}
          </span>
        </div>
        {open
          ? <MdExpandLess className="text-zinc-400 text-xl flex-shrink-0" />
          : <MdExpandMore className="text-zinc-400 text-xl flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}