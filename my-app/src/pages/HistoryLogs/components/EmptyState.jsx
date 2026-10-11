
import { MdHistory, MdBiotech, MdSearchOff,} from 'react-icons/md';



export default function EmptyState({ filtered, onGoScan }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#eeedf7] flex items-center justify-center">
        {filtered
          ? <MdSearchOff className="text-3xl text-[#c8c5ca]" />
          : <MdHistory    className="text-3xl text-[#c8c5ca]" />
        }
      </div>
      <div>
        <p className="text-base font-bold text-black">
          {filtered ? 'No matches found' : 'No scans yet'}
        </p>
        <p className="text-sm text-[#47464a] mt-1 max-w-xs">
          {filtered
            ? 'Try a different filter to see your scan records.'
            : 'Head to the Diagnostic Scanner to identify your first plant.'}
        </p>
      </div>
      {!filtered && (
        <button
          onClick={onGoScan}
          className="mt-2 flex items-center gap-2 bg-[#1b6b51] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#237157] active:scale-95 transition-all shadow-sm"
        >
          <MdBiotech className="text-base" /> Go to Scanner
        </button>
      )}
    </div>
  );
}