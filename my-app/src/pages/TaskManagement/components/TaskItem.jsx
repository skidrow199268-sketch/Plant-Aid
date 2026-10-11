

import {
  formatTaskTime,

} from '../services/TaskManagerService';

// React Icons
import {
  MdCalendarMonth,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdDelete,

} from 'react-icons/md';

import { FaSeedling } from 'react-icons/fa6';

import {CATEGORIES,CATEGORY_COLORS,TYPE_TO_CAT} from '../constant/taskCategories'

export default function TaskItem({ task, userPlants, onToggle, onDelete }) {
  const cat        = TYPE_TO_CAT[task.type] ?? 'prune';
  const clr        = CATEGORY_COLORS[cat];
  const CatIcon    = CATEGORIES.find((c) => c.id === cat)?.icon ?? MdCalendarMonth;
  const plantName  = userPlants.find((p) => p.id === task.userPlantId)?.nickname || '';
  const isOverdue  = !task.completed && (() => {
    const d = task.reminderDate?.toDate ? task.reminderDate.toDate() : new Date(task.reminderDate);
    return d < new Date();
  })();

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all group ${
      task.completed
        ? 'bg-zinc-50 border-zinc-100 opacity-60'
        : isOverdue
          ? 'bg-red-50/40 border-red-100'
          : 'bg-white dark:bg-zinc-900 border-[#c8c5ca]/40 dark:border-zinc-700/50 hover:border-[#1b6b51]/40 hover:shadow-sm'
    }`}>
      {/* Category icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${clr.bg} ${clr.text}`}>
        <CatIcon className="text-lg" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-xs text-[#47464a]">{formatTaskTime(task.reminderDate)}</span>
          {isOverdue && (
            <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">OVERDUE</span>
          )}
        </div>
        <h4 className={`text-sm font-bold leading-snug ${
          task.completed ? 'line-through text-[#47464a] dark:text-gray-500' : 'text-black dark:text-white'
        }`}>
          {task.title}
        </h4>
        {plantName && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#237157] bg-[#a6f2d1]/40 px-2 py-0.5 rounded-full font-medium">
            <FaSeedling className="text-[10px]" />
            {plantName}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggle(task)}
          className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-[#1b6b51] transition-colors text-[#c8c5ca] hover:text-[#1b6b51]"
          title={task.completed ? 'Mark pending' : 'Mark complete'}
        >
          {task.completed
            ? <MdRadioButtonUnchecked className="text-lg" />
            : <MdCheckCircle          className="text-lg text-[#1b6b51]" />
          }
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-[#c8c5ca] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete task"
        >
          <MdDelete className="text-lg" />
        </button>
      </div>
    </div>
  );
}