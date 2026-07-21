export default function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
      <span className="text-xs font-semibold text-[#47464a] flex-shrink-0 w-28">{label}</span>
      <span className="text-xs text-black dark:text-white text-right flex-1">{value}</span>
    </div>
  );
}