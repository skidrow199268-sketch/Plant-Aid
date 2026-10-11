
import {

  deriveStatusType,
  deriveStatusLabel,
  formatScanDate,
  formatConfidenceLabel,
} from '../services/History';

import {
  MdChevronRight,
  MdDeleteOutline,
  MdMoreVert,
  MdOpenInNew,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import {STATUS_THEMES} from '../constant/history'


export default function ScanLogCard({ record, onViewDetails, onDelete, deleting, menuOpen, onToggleMenu, onCloseMenu }) {
  const statusType  = deriveStatusType(record);
  const statusLabel = deriveStatusLabel(record);
  const theme       = STATUS_THEMES[statusType] || STATUS_THEMES.neutral;
  const { Icon }    = theme;

  const handleViewClick = () => {
    onCloseMenu();
    onViewDetails(record.id);
  };

  const handleDeleteClick = () => {
    onCloseMenu();
    onDelete(record.id);
  };

  return (
    <div className="relative group bg-white border border-[#c8c5ca]/60 rounded-2xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)] overflow-hidden">

      <div className="p-4">

        {/* Top row — title + 3-dot menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#eeedf7] flex-shrink-0 flex items-center justify-center">
              <IoLeaf className="text-xl text-[#1b6b51]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-black truncate leading-tight">
                {record.commonName || 'Unknown Plant'}
              </h3>
              {record.scientificName && (
                <p className="text-xs italic text-[#47464a] truncate mt-0.5">{record.scientificName}</p>
              )}
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMenu(record.id); }}
              aria-label="Open record actions"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#47464a] hover:bg-[#f4f2fd] hover:text-black transition-all duration-200 active:scale-95"
            >
              <MdMoreVert className="text-lg" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#c8c5ca] rounded-xl shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] py-1 z-10 animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={handleViewClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-black hover:bg-[#f4f2fd] transition-colors"
                >
                  <MdOpenInNew className="text-base text-[#47464a]" />
                  View Details
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  {deleting
                    ? <span className="w-4 h-4 border-2 border-red-600/40 border-t-red-600 rounded-full animate-spin" />
                    : <MdDeleteOutline className="text-base" />
                  }
                  Delete Record
                </button>
              </div>
            )}
          </div>
        </div>

        {/* dashed ruled line */}
        <div className="border-t border-[#eeedf7] my-3" />

        {/* Bottom row — meta + status */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#47464a]">
            <span>{formatScanDate(record.scannedAt)}</span>
            {record.confidence != null && (
              <>
                <span className="opacity-30">•</span>
                <span className="opacity-70">{formatConfidenceLabel(record.confidence)}</span>
              </>
            )}
            {record.detectedDisease?.trim() && (
              <>
                <span className="opacity-30">•</span>
                <span className="opacity-70">{record.detectedDisease}</span>
              </>
            )}
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.badge}`}>
            <Icon className="text-sm flex-shrink-0" />
            {statusLabel}
          </span>
        </div>

        {/* Quick open — full-width tap target on mobile */}
        <button
          onClick={() => onViewDetails(record.id)}
          aria-label={`Open record for ${record.commonName}`}
          className="absolute inset-0 -z-[1] sm:hidden"
        />
      </div>

      {/* Desktop hover chevron hint */}
      <button
        onClick={() => onViewDetails(record.id)}
        aria-label={`View details for ${record.commonName}`}
        className="hidden sm:flex absolute right-3 bottom-3 w-7 h-7 items-center justify-center rounded-full text-[#c8c5ca] hover:text-[#1b6b51] hover:bg-[#f4f2fd] transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <MdChevronRight className="text-lg" />
      </button>
    </div>
  );
}