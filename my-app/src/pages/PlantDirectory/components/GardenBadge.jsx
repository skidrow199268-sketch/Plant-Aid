
import { IoLeaf } from 'react-icons/io5';
export default function GardenBadge({ count, onClick }) {
  if (count === 0) return null;
  return (
 <button
  onClick={onClick}
  className="fixed bottom-24 md:bottom-6 right-6 z-20 flex items-center gap-2 bg-zinc-950 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-zinc-900/30 hover:bg-zinc-800 active:scale-95 transition-all"
>
  <IoLeaf className="text-emerald-400 text-lg" />
  <span className="text-sm font-bold">{count} in garden</span>
</button>
  );
}