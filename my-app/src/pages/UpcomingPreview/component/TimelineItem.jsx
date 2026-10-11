import  { useState } from 'react';


import {
  MdCheckCircle,
  MdDelete,
} from 'react-icons/md';

import {
  formatReminderDate,
  formatReminderTime,
  relativeReminderLabel,
  REMINDER_TYPE_LABELS,
} from '../services/UpcomingService';


export default function TimelineItem({ item, onComplete, onDelete }) {
  const [completing, setCompleting] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const rel  = relativeReminderLabel(item.reminderDate);
  const time = formatReminderTime(item.reminderDate);
  const type = item.type ?? 'CUSTOM';

  const handleComplete = async (e) => {
    e.stopPropagation();
    setCompleting(true);
    try { await onComplete(item.id); } finally { setCompleting(false); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try { await onDelete(item.id); } finally { setDeleting(false); }
  };

  return (
    <div className="relative pl-11 group cursor-pointer">
      {/* Timeline node */}
      <div className="w-3 h-3 rounded-full bg-white dark:bg-zinc-800 border-2 border-[#1b6b51] absolute left-[11px] top-[18px] z-10 transition-transform duration-200 group-hover:scale-125" />

      {/* Content */}
      <div className="transition-transform duration-200 group-hover:translate-x-1 sm:pr-16">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs text-[#47464a]">
            {(rel === 'Today' || rel === 'Tomorrow')
              ? `${rel}, ${time}`
              : `${formatReminderDate(item.reminderDate)}, ${time}`
            }
          </span>
          {(rel === 'Today' || rel === 'Tomorrow') && (
            <span className="text-[10px] font-bold text-[#237157] bg-[#a6f2d1] rounded-full px-1.5 py-0.5">
              {rel}
            </span>
          )}
          {rel === 'Overdue' && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">
              OVERDUE
            </span>
          )}
        </div>
        <h4
          className="text-[16px] font-bold text-black dark:text-white group-hover:text-[#1b6b51] transition-colors leading-snug"
          style={{ letterSpacing: '-0.02em' }}
        >
          {item.title}
        </h4>
        <p className="text-xs text-[#47464a] mt-1 leading-relaxed">
          {REMINDER_TYPE_LABELS[type]}{item.plantNickname ? ` · ${item.plantNickname}` : ''}
        </p>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="absolute right-0 top-3 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleComplete}
          disabled={completing}
          title="Mark complete"
          className="w-7 h-7 rounded-lg bg-[#a6f2d1] text-[#237157] flex items-center justify-center hover:bg-[#237157] hover:text-white transition-all active:scale-95 disabled:opacity-40"
        >
          {completing
            ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <MdCheckCircle className="text-sm" />
          }
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-40"
        >
          {deleting
            ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : <MdDelete className="text-sm" />
          }
        </button>
      </div>
    </div>
  );
}