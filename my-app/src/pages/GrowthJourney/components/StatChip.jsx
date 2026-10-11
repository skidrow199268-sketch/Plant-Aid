export default function StatChip({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-white border border-zinc-100 rounded-2xl shadow-sm min-w-[80px]">
      <span className="text-[#064e3b] text-xl">{icon}</span>
      <p className="text-lg font-extrabold text-zinc-900 leading-none">{value}</p>
      <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
    </div>
  );
}