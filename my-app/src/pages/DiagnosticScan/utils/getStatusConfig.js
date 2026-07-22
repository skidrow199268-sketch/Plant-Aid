export function getStatusConfig(status) {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('healthy')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-[#a6f2d1]', iconColor: 'text-[#00513b]' };
  }
  if (normalized.includes('attention') || normalized.includes('warning')) {
    return { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' };
  }
  return { bg: 'bg-zinc-50', text: 'text-zinc-700', iconBg: 'bg-zinc-100', iconColor: 'text-zinc-500' };
}