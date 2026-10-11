
import { MdFilterList,} from 'react-icons/md';
import {FILTERS} from '../constant/history'


export default function FilterBar({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <MdFilterList className="text-[#47464a] text-lg flex-shrink-0" />
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            active === f
              ? 'bg-[#1b6b51] text-white shadow-sm'
              : 'bg-white border border-[#c8c5ca] text-[#47464a] hover:border-[#1b6b51]/40'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
