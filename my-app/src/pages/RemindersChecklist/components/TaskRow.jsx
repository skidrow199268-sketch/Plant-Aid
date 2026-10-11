import { useState,  } from 'react';


import {
  MdDelete,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import {
  formatTime,
  REMINDER_TYPE_LABELS,

} from '../services/ReminderService';

import {TYPE_ICONS,TYPE_STYLES} from '../constant/reminder.jsx'



export default function TaskRow({ task, isLast, onToggle, onDelete }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(task.id, !task.completed); } finally { setToggling(false); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try { await onDelete(task.id); } finally { setDeleting(false); }
  };

  const type = task.type ?? 'CUSTOM';

  return (
    <div className={`flex items-center gap-4 py-3.5 px-2 transition-all duration-200 hover:bg-neutral-50/70 group rounded-2xl ${!isLast ? 'border-b border-neutral-100/80' : ''}`}>
      <div className="relative flex items-center flex-shrink-0">
        <input className="hidden" id={`task-${task.id}`} type="checkbox" checked={task.completed} onChange={handleToggle} disabled={toggling} />
        <label htmlFor={`task-${task.id}`} className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 ${toggling ? 'opacity-50' : ''} ${task.completed ? 'bg-[#1b6b51] border-[#1b6b51]' : 'border-neutral-300 bg-white hover:border-[#1b6b51] hover:bg-emerald-50/30'}`}>
          {task.completed && (
            toggling
              ? <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
        </label>
      </div>

      <div className="flex flex-col flex-grow select-none min-w-0 pr-2">
        <span className={`text-[15px] font-medium transition-all duration-300 truncate ${task.completed ? 'line-through text-neutral-400 font-normal' : 'text-neutral-800'}`}>
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-400">
          <span>{formatTime(task.reminderDate)}</span>
          {task.plantNickname && <><span className="text-neutral-300">·</span><span className="font-medium text-neutral-500 truncate">{task.plantNickname}</span></>}
        </div>
      </div>

      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border flex-shrink-0 ${TYPE_STYLES[type]?.bg} ${TYPE_STYLES[type]?.border} ${TYPE_STYLES[type]?.color}`}>
        <span className="text-xs">{TYPE_ICONS[type]}</span>
        <span className="hidden sm:inline">{REMINDER_TYPE_LABELS[type]}</span>
      </span>

      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
        <button onClick={handleDelete} disabled={deleting} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-7 h-7 rounded-lg bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 disabled:opacity-40" title="Delete">
          {deleting ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <MdDelete className="text-base" />}
        </button>
      </div>
    </div>
  );
}
