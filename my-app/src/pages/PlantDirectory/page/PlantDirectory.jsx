import{ useState, useDeferredValue, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, MobileNav } from '../../../components/index';
import {loadDirectoryData, togglePlantInGarden,inferCategory,} from '../services/PlantService';
import { seedPlants } from '../seeder/Plantseeder';
import { MdSearch} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { FaSeedling } from 'react-icons/fa6';
import {CATEGORIES} from '../constant/plant'

import {EmptyState,GardenBadge,Pagination,PlantRow,Toast} from '../components/index'

const PAGE_SIZE = 20;

export default function PlantDirectory() {
  const navigate                  = useNavigate();
  const { currentUser }           = useAuth();
  const userId                    = currentUser?.uid ?? null;

  // ── Data state ──────────────────────────────────────────
  const [plants,        setPlants]        = useState([]);
  const [addedIds,      setAddedIds]      = useState(new Set());   
  const [togglingIds,   setTogglingIds]   = useState(new Set());   
  const [loadingData,   setLoadingData]   = useState(true);
  const [dataError,     setDataError]     = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
 

  // ── Filter state ─────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState('All Plants');
  const deferredQuery = useDeferredValue(searchQuery.toLowerCase().trim());

  // ── Toast ────────────────────────────────────────────────
  const [toast,        setToast]        = useState({ message: '', visible: false });
  const toastTimer                      = useRef(null);
  const listRef                         = useRef(null);



  const showToast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }, []);

  // ── Pagination ────────────────────────────────────────────
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ── SEED BUTTON (dev tool) — REMOVE AFTER SEEDING ─────────


  useEffect(() => {
    (async () => {
      setLoadingData(true);
      setDataError(null);
      try {

   
        const { plants: allPlants, addedPlantIds } = await loadDirectoryData(userId);
        setPlants(allPlants);
        setAddedIds(addedPlantIds);
      } catch (err) {
        console.error('Directory load error:', err);
        setDataError('Failed to load the plant directory. Please check your connection and refresh.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [userId]);

  // ── Toggle garden membership ──────────────────────────────
  const handleToggleGarden = useCallback(async (plant) => {
    if (!userId) {
      navigate('/auth/login');
      return;
    }

    // Optimistic update
    const wasAdded = addedIds.has(plant.id);
    setAddedIds((prev) => {
      const next = new Set(prev);
      wasAdded ? next.delete(plant.id) : next.add(plant.id);
      return next;
    });
    setTogglingIds((prev) => new Set(prev).add(plant.id));

    try {
      const { added } = await togglePlantInGarden(userId, plant);
      showToast(added ? `${plant.name} added to your garden!` : `${plant.name} removed from garden.`);
    } catch (err) {
      console.error('Toggle garden error:', err);
      // Revert optimistic update on failure
      setAddedIds((prev) => {
        const next = new Set(prev);
        wasAdded ? next.add(plant.id) : next.delete(plant.id);
        return next;
      });
      showToast('Something went wrong. Please try again.');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(plant.id);
        return next;
      });
    }
  }, [userId, addedIds, navigate, showToast]);

  // ── Filtering logic ───────────────────────────────────────
  const filteredPlants = plants.filter((plant) => {
    const category  = inferCategory(plant);
    const matchesCat = activeCategory === 'All Plants' || category === activeCategory;
    const matchesSrc = !deferredQuery ||
      plant.name?.toLowerCase().includes(deferredQuery) ||
      plant.scientificName?.toLowerCase().includes(deferredQuery) ||
      plant.description?.toLowerCase().includes(deferredQuery);
    return matchesCat && matchesSrc;
  });

  const gardenCount = addedIds.size;

  // ── Available categories from current catalog ─────────────
  const availableCategories = ['All Plants', ...Array.from(
    new Set(plants.map(inferCategory))
  ).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  })];

   const totalPages = Math.max(1, Math.ceil(filteredPlants.length / PAGE_SIZE));
   const safePage = Math.min(currentPage, totalPages);
   const visiblePlants = filteredPlants.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Show full-page loader ─────────────────────────────────
  if (loadingData) {
    return <FullPageLoader message="Loading plant directory" />;
  }

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b22] min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900 pb-28 md:pb-0">
      <Topbar />
      {/* Desktop topbar — hidden on small screens */}

{/* Mobile topbar — visible only on small screens */}
<div className="block lg:hidden">
  <MobileNav/>
</div>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-6 py-10">

        {/* Page Header */}
        <header className="mb-10 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1b6b51]">Directory</p>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              Plant Directory
            </h1>
            <p className="text-sm text-[#47464a]">
              Explore and discover new specimens for your collection.
            </p>
          </div>
=
      
        </header>

        {/* Error Banner */}
        {dataError && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            {dataError}
          </div>
        )}

       

        {/* Search + Filter Bar */}
        <section className="mb-8 space-y-4">
          {/* Search input */}
          <div className="relative group">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl transition-colors group-focus-within:text-emerald-600" />
            <input
              className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl font-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm text-sm placeholder:text-zinc-400"
              placeholder="Search plants, scientific names, or descriptions…"
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors text-sm font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
            {(availableCategories.length > 1 ? availableCategories : CATEGORIES).map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap font-medium ${
                    isActive
                      ? 'bg-zinc-950 text-white font-semibold shadow-sm'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Results count */}
 

 <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium">
              {filteredPlants.length} {filteredPlants.length === 1 ? 'plant' : 'plants'} found
            </p>
            {gardenCount > 0 && (
              <button
                onClick={() => navigate('/collection')}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <IoLeaf className="text-emerald-500" />
                {gardenCount} in your garden
              </button>
            )}
          </div>


  

        </section>

        {/* Plant List */}
        <section ref={listRef} className="scroll-mt-28">
          {filteredPlants.length === 0 ? (
  <EmptyState query={deferredQuery} category={activeCategory} />
) : (
  <div className="space-y-3">
    {visiblePlants.map((plant) => (
      <PlantRow
        key={plant.id}
        plant={plant}
        isAdded={addedIds.has(plant.id)}
        isToggling={togglingIds.has(plant.id)}
        onToggleGarden={handleToggleGarden}
      />
    ))}
  </div>
)}
        </section>

        {/* Pagination */}
        {filteredPlants.length > PAGE_SIZE && (
          <Pagination
            currentPage={safePage}
            totalItems={filteredPlants.length}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <footer className="bg-white flex flex-col items-center gap-2 w-full px-6 mt-auto py-6 border-t border-zinc-200/80">
        <div className="flex gap-6">
          <a className="text-zinc-400 hover:text-emerald-700 transition-colors text-xs" href="#">Sign up</a>
          <a className="text-zinc-400 hover:text-emerald-700 transition-colors text-xs" href="#">Privacy Policy</a>
          <a className="text-zinc-400 hover:text-emerald-700 transition-colors text-xs" href="#">Help Center</a>
        </div>
        <p className="text-xs text-zinc-400/60 mt-1">© {new Date().getFullYear()} PlantAid. Botanical Precision.</p>
      </footer>

      {/* Floating garden count badge */}

  <GardenBadge count={gardenCount} onClick={() => navigate('/collection')} />
  


      {/* Toast notification */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}