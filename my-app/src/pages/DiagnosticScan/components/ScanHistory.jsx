import { useState } from 'react';
import { MdHistory } from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

function ScanThumb({ scan, formatDate }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = scan.imageUrl && !imgFailed;

  return (
    <div className="flex-shrink-0 w-28 bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 overflow-hidden">
      <div className="h-20 bg-zinc-100 flex items-center justify-center overflow-hidden">
        {showImage ? (
          <img
            src={scan.imageUrl}
            alt={scan.commonName || 'Plant'}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <IoLeaf className="text-2xl text-zinc-300" />
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-bold text-black dark:text-white truncate leading-tight">{scan.commonName}</p>
        <p className="text-[10px] text-[#47464a] mt-0.5">{scan.confidence}% · {formatDate(scan.scannedAt)}</p>
      </div>
    </div>
  );
}

export default function ScanHistory({ history }) {
  if (history.length === 0) return null;

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MdHistory className="text-[#47464a]" />
        <h3 className="text-sm font-bold text-[#47464a] uppercase tracking-widest">Recent Scans</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {history.map((scan) => (
          <ScanThumb key={scan.id} scan={scan} formatDate={formatDate} />
        ))}
      </div>
    </div>
  );
}