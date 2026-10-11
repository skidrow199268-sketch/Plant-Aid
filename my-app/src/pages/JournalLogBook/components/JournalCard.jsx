

import {formatJournalDate,} from '../services/JournalService';


// React Icons
import { MdDelete, MdEdit, MdCalendarToday} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';




export default function JournalCard({ entry, onDelete, onEdit }) {
  return (
    <article className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.01)] transition-all hover:shadow-[0_12px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 group relative">
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <span className="flex items-center gap-1.5 bg-neutral-50 text-neutral-500 border border-neutral-200/40 text-xs px-2.5 py-1 rounded-md">
          <MdCalendarToday className="text-[11px]" />
          {formatJournalDate(entry.createdAt)}
        </span>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 hover:bg-zinc-100 hover:text-zinc-800 rounded-lg transition-all text-neutral-400"
            title="Edit entry"
          >
            <MdEdit className="text-[18px]" />
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all text-neutral-400"
            title="Delete entry"
          >
            <MdDelete className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Image */}
      {entry.imageUrl ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 bg-neutral-50 border border-neutral-100">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={entry.imageUrl}
            alt={entry.title}
          />
        </div>
      ) : (
        <div className="aspect-video w-full rounded-xl mb-4 bg-gradient-to-br from-[#a6f2d1]/20 to-emerald-50 border border-emerald-100/50 flex items-center justify-center">
          <IoLeaf className="text-4xl text-emerald-200" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-black tracking-tight leading-tight">{entry.title}</h3>
        <p className="text-neutral-500 text-sm line-clamp-3 leading-relaxed">{entry.content}</p>
      </div>

      <div className="absolute top-0 right-8 w-0.5 h-6 bg-[#1b6b51] opacity-0 group-hover:opacity-100 transition-opacity rounded-b-full" />
    </article>
  );
}
