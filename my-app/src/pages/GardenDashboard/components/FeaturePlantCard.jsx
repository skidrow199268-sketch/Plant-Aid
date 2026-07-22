import { useState, useEffect } from 'react';
import { MdClose, MdGridView } from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { FALLBACK_IMAGE } from '../constant/collection.js';

function PlantListModal({ plants, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[80vh] overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-2xl z-10 flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Plants ({plants.length})
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MdClose className="text-lg text-zinc-400" />
          </button>
        </div>

        <div className="overflow-y-auto px-3 py-3 space-y-2">
          {plants.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No plants in your garden yet.</p>
          ) : (
            plants.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-zinc-800 border border-transparent hover:border-emerald-200 dark:hover:border-zinc-700 transition-all text-left"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.nickname || 'Plant'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoLeaf className="text-xl text-zinc-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{p.nickname || 'My Plant'}</p>
                  {p.scientificName && (
                    <p className="text-xs italic text-zinc-400 truncate">{p.scientificName}</p>
                  )}
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{p.currentStage || '—'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedPlantCard({ plant, allPlants = [], onSelectPlant, navigate }) {
  const [imgError, setImgError] = useState(false);
  const [showList, setShowList] = useState(false);
  useEffect(() => { setImgError(false); }, [plant?.id]);

  const imgSrc    = (!plant?.imageUrl || imgError) ? FALLBACK_IMAGE : plant.imageUrl;
  const plantName = plant?.nickname     || 'Your Garden';
  const stage     = plant?.currentStage || '';

  const handleSelect = (p) => {
    setShowList(false);
    onSelectPlant?.(p);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl shadow-md group" style={{ height: '320px' }}>
        <img
          alt={plantName}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
          src={imgSrc}
          onClick={() => plant && navigate(`/plants/${plant.plantId}`)}
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

        {allPlants.length > 1 && (
          <button
            onClick={() => setShowList(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-white/25 active:scale-95 transition-all"
          >
            <MdGridView className="text-sm" />
            See More
          </button>
        )}

        <div
          className={`absolute bottom-0 left-0 p-5 text-white ${plant ? 'cursor-pointer' : ''}`}
          onClick={() => plant && navigate(`/plants/${plant.plantId}`)}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-[#1b6b51] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">Plant Health</span>
            {stage && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/30 text-white uppercase">{stage}</span>
            )}
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight leading-tight">{plantName}</h3>
          {plant && <p className="text-white/70 text-xs mt-1">Tap to view full details <span className="text-[#a6f2d1]">→</span></p>}
        </div>
      </div>

      {showList && (
        <PlantListModal
          plants={allPlants}
          onSelect={handleSelect}
          onClose={() => setShowList(false)}
        />
      )}
    </>
  );
}