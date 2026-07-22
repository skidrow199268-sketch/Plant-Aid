// ============================================================
// PlantTipsSlider.jsx
// Tips carousel + full tips grid with search & filter.
// Uses Topbar + FullPageLoader reusable components.
// Seeder trigger included — see DELETE COMMENT below.
// ============================================================

import  { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight,} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import { Topbar, FullPageLoader, MobileNav } from '../../../components/index';
import { fetchFeaturedTips, fetchTipsByCategory, incrementTipViews } from '../services/PlantTip';
import {CATEGORY_ICONS,CAROUSEL_CATEGORIES} from '../constant/tip'

import {AccentCard,AllTipsGrid,CarouselTipCard,DeepDiveModal} from '../components/index'
export default function PlantTipsSlider() {
  const carouselRef = useRef(null);

  const [tips,           setTips]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [atStart,        setAtStart]        = useState(true);
  const [atEnd,          setAtEnd]          = useState(false);

  // ── Modal state ──────────────────────────────────────────
  const [selectedTip, setSelectedTip] = useState(null);

  const handleDeepDive = useCallback(async (tip) => {
    setSelectedTip(tip);
    try { await incrementTipViews(tip.id); } catch (err) { console.error('Failed to increment views:', err); }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTip(null);
  }, []);


  // ── Fetch carousel tips whenever category changes ────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const data = activeCategory === 'All'
          ? await fetchFeaturedTips(8)
          : await fetchTipsByCategory(activeCategory, 8);
        if (!cancelled) setTips(data);
      } catch (err) {
        console.error('Failed to load tips:', err);
        if (!cancelled) setTips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeCategory]);

  // ── Scroll position tracking ─────────────────────────────
  const updateButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateButtons);
    updateButtons();
    return () => {
      el.removeEventListener('scroll', updateButtons);
      window.removeEventListener('resize', updateButtons);
    };
  }, [tips]);

  const scrollCarousel = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.offsetWidth * 0.75, behavior: 'smooth' });
  };

  if (loading && tips.length === 0) {
    return <FullPageLoader message="Loading botanical insights" />;
  }

  return (
    <div className="bg-[#fbf8ff] dark:bg-[#0f0f0f] text-[#1a1b22] dark:text-gray-100 min-h-screen flex flex-col  pb-20 lg:pb-0">

      <Topbar />

      {/* Mobile nav */}
      <div className="block lg:hidden">
        <MobileNav />
      </div>

      <main className="flex-grow px-6 py-12 w-full max-w-7xl mx-auto">

        {/* ── CAROUSEL SECTION ─────────────────────────────── */}
        <section>
          <div className="mb-6">
            <span className="text-xs font-semibold text-black/50 dark:text-gray-400 tracking-widest uppercase">
              Curated Learning
            </span>
            <div className="flex items-end justify-between flex-wrap gap-4 mt-1">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white tracking-tight max-w-lg">
                  Daily Gardening Insights
                </h2>
                <p className="text-base text-[#47464a] max-w-xl mt-2 leading-relaxed">
                  Clinically-tested botanical techniques designed to help your indoor flora thrive.
                </p>
              </div>
              <div className="flex gap-2 self-end">
                <button
                  onClick={() => scrollCarousel(-1)}
                  disabled={atStart}
                  className={`w-11 h-11 rounded-full border border-[#c8c5ca] flex items-center justify-center transition-all duration-200 active:scale-95 ${
                    atStart ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#e8e7f1] cursor-pointer'
                  }`}
                >
                  <MdChevronLeft className="text-[22px]" />
                </button>
                <button
                  onClick={() => scrollCarousel(1)}
                  disabled={atEnd}
                  className={`w-11 h-11 rounded-full border border-[#c8c5ca] flex items-center justify-center transition-all duration-200 active:scale-95 ${
                    atEnd ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#e8e7f1] cursor-pointer'
                  }`}
                >
                  <MdChevronRight className="text-[22px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-6">
            {CAROUSEL_CATEGORIES.map((cat) => {
              const CatIcon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-[#47464a] border-[#c8c5ca]/60 hover:border-[#1b6b51]/40'
                  }`}
                >
                  {CatIcon && <CatIcon className="text-sm" />}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Carousel */}
          {tips.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center w-full max-w-sm mx-auto">
              <div className="w-16 h-16 bg-[#a6f2d1]/30 rounded-2xl flex items-center justify-center">
                <IoLeaf className="text-3xl text-[#1b6b51]" />
              </div>
              <p className="text-base font-bold text-black dark:text-white">No tips yet</p>
              <p className="text-sm text-[#47464a]">
                {activeCategory === 'All' ? 'Tips are on the way. Check back soon!' : `No tips found for "${activeCategory}" yet.`}
              </p>
            </div>
          ) : (
            <div
              className="[mask-image:linear-gradient(to_right,black_88%,transparent_100%)]"
              style={{ WebkitMaskImage: 'linear-gradient(to right, black 88%, transparent 100%)' }}
            >
              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="min-w-[260px] md:min-w-[360px] snap-start flex-shrink-0">
                        <div className="bg-white dark:bg-zinc-900 border border-[#c8c5ca]/30 dark:border-zinc-700/50 rounded-3xl p-6 h-72 flex flex-col gap-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)] dark:shadow-zinc-900/30 animate-pulse">
                          <div className="flex justify-between">
                            <div className="w-12 h-12 bg-[#e8f8f1] rounded-xl" />
                            <div className="w-20 h-6 bg-[#e8f8f1] rounded-full" />
                          </div>
                          <div className="h-5 bg-[#e8f8f1] rounded-lg w-3/4" />
                          <div className="h-4 bg-[#e8f8f1] rounded-lg w-full" />
                          <div className="h-4 bg-[#e8f8f1] rounded-lg w-5/6" />
                          <div className="h-4 bg-[#e8f8f1] rounded-lg w-4/6 mt-auto" />
                        </div>
                      </div>
                    ))
                  : (
                    <>
                      {tips.map((tip) => (
                        <CarouselTipCard key={tip.id} tip={tip} onDeepDive={handleDeepDive} />
                      ))}
                      <AccentCard />
                    </>
                  )
                }
              </div>
            </div>
          )}
        </section>

        {/* Section divider */}
        <div className="border-t border-[#c8c5ca]/30 mt-16" />

        {/* ── ALL TIPS GRID SECTION ─────────────────────────── */}
        <AllTipsGrid onDeepDive={handleDeepDive} />

      </main>

      {/* Footer */}
      <footer className="bg-[#fbf8ff] border-t border-[#c8c5ca] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <IoLeaf className="text-[#1b6b51]" />
            <span className="text-lg font-bold text-black dark:text-white">PlantAid</span>
          </div>
          <div className="flex gap-5">
            <a className="text-sm text-[#47464a] hover:text-[#1b6b51] transition-colors" href="#signup">Sign up</a>
            <a className="text-sm text-[#47464a] hover:text-[#1b6b51] transition-colors" href="#privacy">Privacy Policy</a>
            <a className="text-sm text-[#47464a] hover:text-[#1b6b51] transition-colors" href="#help">Help Center</a>
          </div>
          <p className="text-sm text-[#1b6b51]">© {new Date().getFullYear()} PlantAid. Botanical Precision.</p>
        </div>
      </footer>

      {/* ── DEEP DIVE MODAL ───────────────────────────────── */}
      {selectedTip && (
        <DeepDiveModal tip={selectedTip} onClose={handleCloseModal} />
      )}

    </div>
  );
}