export default function Pill({ label, bg = 'bg-zinc-100', text = 'text-zinc-700' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}