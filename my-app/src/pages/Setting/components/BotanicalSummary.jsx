import { MdEco } from "react-icons/md";
import {getBotanicalInsight} from '../../DashboardToday/services/DashboardServices'
import { getSeason } from '../../DashboardToday/utils/season'
export default function BotanicalSummary({ weather }) {
  const insight = getBotanicalInsight(weather ?? null);
  const season = getSeason(weather ?? null);

  return (
    <div className="p-4 sm:p-5 bg-[#a6f2d1]/30 rounded-2xl flex items-start gap-3 sm:gap-4">
      <div className="bg-[#1b6b51] rounded-full p-2.5 sm:p-3 text-white flex-shrink-0">
        <MdEco className="text-lg sm:text-xl" />
      </div>
      <div className="min-w-0">
        <p className="text-sm sm:text-base font-bold text-[#1b6b51]">
          Botanical Care Insight
          {season && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1b6b51]/10 text-[#1b6b51] align-middle">{season.label}</span>}
        </p>
        <p className="text-[#47464a] text-xs sm:text-sm mt-1 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}