
import {
  MdCheckCircle,
} from 'react-icons/md';

import {STAGE_ICONS} from '../constant/growth.jsx'

export default function StageDot({ index, isVisited, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all duration-300 z-10 focus:outline-none focus:ring-2 focus:ring-[#064e3b]/40 ${
        isActive
          ? 'bg-[#064e3b] border-4 border-[#d1fae5] text-white shadow-md scale-110'
          : isVisited
          ? 'bg-[#064e3b] border-4 border-[#d1fae5]/60 text-white shadow-sm'
          : 'bg-neutral-100 border-2 border-neutral-200 text-neutral-400 hover:border-[#064e3b]/30'
      }`}
    >
      {isVisited && !isActive ? (
        <MdCheckCircle className="text-[18px]" />
      ) : (
        <span className="text-[13px]">{STAGE_ICONS[index]}</span>
      )}
    </button>
  );
}