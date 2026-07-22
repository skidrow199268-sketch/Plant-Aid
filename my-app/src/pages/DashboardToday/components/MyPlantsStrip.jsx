import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {HealthBadge} from './index'
import { IoLeaf } from "react-icons/io5";

function PlantThumb({ plant, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = plant.imageUrl && !imgFailed;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all p-3 text-left group"
    >
      <div className="w-full h-24 rounded-xl overflow-hidden bg-emerald-100 flex items-center justify-center mb-3">
        {showImage ? (
          <img
            src={plant.imageUrl}
            alt={plant.nickname || 'Plant'}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <IoLeaf className="text-3xl text-emerald-400" />
        )}
      </div>
      <p className="text-sm font-bold text-zinc-800 truncate">{plant.nickname || 'My Plant'}</p>
      <div className="mt-1">
        <HealthBadge status={plant.healthStatus || 'HEALTHY'} />
      </div>
      <p className="text-[11px] text-zinc-400 mt-1 truncate">{plant.currentStage || '—'}</p>
    </button>
  );
}

export default function MyPlantsStrip({ userPlants = [] }) {
  const navigate = useNavigate();
  if (userPlants.length === 0) return null;

  return (
    <section className="col-span-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-100 dark:hover:shadow-zinc-900/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-zinc-900">My Plants</h3>
        <button
          onClick={() => navigate('/collection')}
          className="text-emerald-700 font-bold text-sm hover:underline"
        >
          View Collection
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {userPlants.slice(0, 8).map((plant) => (
          <PlantThumb
            key={plant.id}
            plant={plant}
            onClick={() => navigate(`/plants/${plant.plantId}`)}
          />
        ))}
      </div>
    </section>
  );
}