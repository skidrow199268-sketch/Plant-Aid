

// React Icons
import {
  MdCalendarMonth,
  MdCheckCircle,
 
} from 'react-icons/md';

import {CATEGORIES,TYPE_TO_CAT} from '../constant/taskCategories'

export default function ActivePrescriptions({ tasks, userPlants }) {
  const pending = tasks.filter((t) => !t.completed).slice(0, 5);

  return (
    <div className="bg-[#a6f2d1]/20 rounded-3xl p-5 h-full">
      <h2 className="text-base font-bold text-[#1b6b51] mb-4">
        Active Prescriptions
      </h2>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <MdCheckCircle className="text-3xl text-[#1b6b51]/30" />
          <p className="text-sm text-[#1b6b51]/60">All tasks completed!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((t) => {
            const cat     = TYPE_TO_CAT[t.type] ?? 'prune';
            const CatIcon = CATEGORIES.find((c) => c.id === cat)?.icon ?? MdCalendarMonth;
            const plant   = userPlants.find((p) => p.id === t.userPlantId);
            return (
              <div
                key={t.id}
                className="bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 flex items-center justify-between text-sm shadow-sm border border-[#a6f2d1]/40 dark:border-zinc-700/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CatIcon className="text-[#1b6b51] text-base flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-black dark:text-white truncate text-xs leading-tight">{t.title}</p>
                    {plant && <p className="text-[10px] text-[#47464a] truncate">{plant.nickname}</p>}
                  </div>
                </div>
                <MdCheckCircle className="text-[#1b6b51] text-lg flex-shrink-0 ml-2" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
