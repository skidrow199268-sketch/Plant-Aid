import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

function getPageItems(current, total) {
  const items = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i += 1) items.push(i);
    return items;
  }

  items.push(1);
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) items.push('…');
  for (let i = left; i <= right; i += 1) items.push(i);
  if (right < total - 1) items.push('…');
  items.push(total);
  return items;
}

export default function Pagination({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const items = getPageItems(currentPage, totalPages);
  const go = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const baseBtn = 'flex items-center justify-center min-w-10 h-10 px-3 rounded-xl text-sm font-semibold border transition-all active:scale-95';
  const idle = 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50';
  const active = 'bg-zinc-950 text-white border-zinc-950 shadow-sm';
  const disabled = 'opacity-40 cursor-not-allowed';

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => go(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={`${baseBtn} ${idle} ${currentPage === 1 ? disabled : ''}`}
      >
        <MdChevronLeft className="text-xl" />
      </button>

      {items.map((item, i) =>
        item === '…' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-zinc-400 select-none">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`${baseBtn} ${item === currentPage ? active : idle}`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={`${baseBtn} ${idle} ${currentPage === totalPages ? disabled : ''}`}
      >
        <MdChevronRight className="text-xl" />
      </button>
    </nav>
  );
}
