import { useState } from 'react';
import {TimelineItem} from './index'
import { MdWarningAmber, MdRefresh, MdExpandMore, MdExpandLess} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';


import { COLLAPSED_LIMIT} from '../constant/upcoming'

export default function UpcomingPanel({ items, overdueCount, onComplete, onDelete, onAdd, onReload, reloading }) {
  // expanded = show all items; collapsed = show COLLAPSED_LIMIT items
  const [expanded, setExpanded] = useState(false);

  const hasMore       = items.length > COLLAPSED_LIMIT;
  const visibleItems  = expanded ? items : items.slice(0, COLLAPSED_LIMIT);
  const hiddenCount   = items.length - COLLAPSED_LIMIT;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-zinc-900/30 flex flex-col h-full">

      {/* ── Panel header ───────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3 flex-shrink-0">
        <h2 className="text-lg font-bold text-black dark:text-white tracking-tight">
          Next 48 Hours
        </h2>
        <div className="flex items-center gap-2">
          <span className="bg-[#a6f2d1] text-[#237157] rounded-full px-3 py-1 text-[11px] font-bold tracking-widest">
            UPCOMING
          </span>
        </div>
      </div>

      {/* ── Reload hint ─────────────────────────────────── */}
      <div className="px-6 pb-3 flex-shrink-0">
        <button
          onClick={onReload}
          disabled={reloading}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#47464a] hover:text-[#1b6b51] transition-colors disabled:opacity-50"
        >
          <MdRefresh className={`text-sm ${reloading ? 'animate-spin' : ''}`} />
          {reloading ? 'Refreshing…' : 'Reload to see the latest'}
        </button>
      </div>

      {/* ── Overdue warning ─────────────────────────────── */}
      {overdueCount > 0 && (
        <div className="mx-6 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex-shrink-0">
          <MdWarningAmber className="text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            {overdueCount} overdue reminder{overdueCount > 1 ? 's' : ''} need attention
          </p>
        </div>
      )}

      {/* ── Scrollable timeline ─────────────────────────── */}
      {/* Fixed height — content scrolls inside, panel never grows */}
      <div
        className="relative flex-1 min-h-0 overflow-y-auto px-6 pb-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e3e1ec transparent' }}
      >
        {/* Vertical track line */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-[#f0eff9] pointer-events-none" />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <IoLeaf className="text-3xl text-[#a6f2d1]" />
            <p className="text-sm text-[#47464a]">No upcoming reminders.</p>
            <button
              onClick={onAdd}
              className="text-xs font-bold text-[#1b6b51] hover:underline"
            >
              + Add one now
            </button>
          </div>
        ) : (
          <div className="relative flex flex-col gap-7 py-2">
            {visibleItems.map((item) => (
              <TimelineItem
                key={item.id}
                item={item}
                onComplete={onComplete}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer: expand/collapse + count ─────────────── */}
      <div className="px-6 pt-3 pb-6 flex-shrink-0 space-y-3 border-t border-[#f0eff9] mt-2">

        {/* Show more / show less — no navigation, pure in-place toggle */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#c8c5ca]/60 text-sm font-semibold text-[#47464a] hover:border-[#1b6b51] hover:text-[#1b6b51] transition-all"
          >
            {expanded ? (
              <>
                <MdExpandLess className="text-lg" />
                Show less
              </>
            ) : (
              <>
                <MdExpandMore className="text-lg" />
                View all {hiddenCount} more reminder{hiddenCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        )}

        {/* CTA button */}
       
      </div>
    </div>
  );
}