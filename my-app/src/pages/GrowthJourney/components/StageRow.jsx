import {StageDot} from './index'

export default function StageRow({ stage, index, currentIndex, onSelect }) {
  const isVisited = index <= currentIndex;
  const isActive  = index === currentIndex;

  return (
    <div
      className="group cursor-pointer relative flex items-start gap-6"
      onClick={() => onSelect(index)}
    >
      <StageDot
        index={index}
        isVisited={isVisited}
        isActive={isActive}
        onClick={() => onSelect(index)}
      />
      <div className="flex-grow pt-0.5 pb-1">
        <h3 className={`text-base tracking-tight transition-all duration-300 ${
          isActive   ? 'text-[#064e3b] font-extrabold' :
          isVisited  ? 'text-[#064e3b] font-semibold'  :
                       'text-zinc-800 font-semibold'
        }`}>
          {stage.title}
        </h3>
        <p className={`text-sm leading-snug mt-0.5 transition-all duration-300 ${
          isActive ? 'text-zinc-600' : 'text-zinc-400'
        }`}>
          {stage.description}
        </p>
      </div>
      {isActive && (
        <span className="mt-1 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#064e3b] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Current
        </span>
      )}
    </div>
  );
}