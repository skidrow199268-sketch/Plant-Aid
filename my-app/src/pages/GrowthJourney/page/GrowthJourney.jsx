import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, MobileSectionNav, SectionHeader, Footer } from '../../../components/index';

// React Icons
import {
  MdEco,

  MdSpa,
  MdScience,
  
  MdCalendarToday,
 
} from 'react-icons/md';
import {
  loadJourneyData,
  loadPlantJourneyDetail,
  jumpToStage,
  advancePlantStage,
  retreatPlantStage,
  GROWTH_STAGES,
  stageIndexOf,
  daysSincePlanted,
  healthStatus,
} from '../services/GrowthJourneyService';

import {DetailSpinner,EmptyGarden,ErrorBanner,GrowthTimeline,PlantHeroCard,
  StageHistoryPanel,Toast,StatChip,PlantSelectorCard
} from '../components/index'



export default function GrowthJourney() {
  const navigate        = useNavigate();
  const { currentUser } = useAuth();
  const userId          = currentUser?.uid ?? null;

  // ── Data ────────────────────────────────────────────────
  const [userPlants,    setUserPlants]    = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [masterPlant,   setMasterPlant]   = useState(null);
  const [stageLogs,     setStageLogs]     = useState([]);

  // ── UI ──────────────────────────────────────────────────
  const [loadingList,   setLoadingList]   = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingStage,   setSavingStage]   = useState(false);
  const [dataError,     setDataError]     = useState(null);
  const [detailError,   setDetailError]   = useState(null);

  // ── Local stage key (mirrors selectedPlant.currentStage) ──
  const [currentStageKey, setCurrentStageKey] = useState(GROWTH_STAGES[0].key);
  const currentStageIdx = stageIndexOf(currentStageKey);
  const activeTrackPct  = `${(currentStageIdx / (GROWTH_STAGES.length - 1)) * 100}%`;

  // ── Toast ────────────────────────────────────────────────
  const [toast,       setToast]       = useState({ message: '', visible: false });
  const toastTimerRef                 = React.useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2500,
    );
  }, []);

  // ── Helper: sync a new stage key into all local state ────
  const syncStageKey = useCallback((plantId, newKey) => {
    setCurrentStageKey(newKey);
    setUserPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, currentStage: newKey } : p)),
    );
    setSelectedPlant((prev) => (prev ? { ...prev, currentStage: newKey } : prev));
  }, []);

  // ── Helper: refresh stage logs after a write ─────────────
  const refreshLogs = useCallback(async (userPlantId) => {
    const { stageLogs: logs } = await loadPlantJourneyDetail(userPlantId);
    setStageLogs(logs);
  }, []);

  // ── 1. Select a plant + load its detail ──────────────────
  const selectPlant = useCallback(async (userPlant) => {
    setSelectedPlant(userPlant);
    setCurrentStageKey(userPlant.currentStage ?? GROWTH_STAGES[0].key);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const { masterPlant: mp, stageLogs: logs } = await loadPlantJourneyDetail(userPlant.id);
      setMasterPlant(mp);
      setStageLogs(logs);
    } catch (err) {
      console.error('Detail load error:', err);
      setDetailError('Could not load plant details.');
      setMasterPlant(null);
      setStageLogs([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ── 2. Load plant list on mount ───────────────────────────
  useEffect(() => {
    if (!userId) { setLoadingList(false); return; }
    (async () => {
      setLoadingList(true);
      setDataError(null);
      try {
        const { userPlants: plants } = await loadJourneyData(userId);
        setUserPlants(plants);
        if (plants.length > 0) await selectPlant(plants[0]);
      } catch (err) {
        console.error('Journey load error:', err);
        setDataError('Failed to load your plants. Please check your connection and refresh.');
      } finally {
        setLoadingList(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── 3. Jump to stage by clicking the timeline ─────────────
  const handleStageSelect = useCallback(async (idx) => {
    if (!selectedPlant || savingStage) return;
    const targetKey = GROWTH_STAGES[idx].key;
    if (targetKey === currentStageKey) return;

    setSavingStage(true);
    syncStageKey(selectedPlant.id, targetKey);           // optimistic
    try {
      await jumpToStage(selectedPlant.id, targetKey);
      await refreshLogs(selectedPlant.id);
      showToast(`Stage updated to "${targetKey}"`);
    } catch (err) {
      console.error('Stage jump error:', err);
      syncStageKey(selectedPlant.id, selectedPlant.currentStage); // revert
      showToast('Failed to update stage. Please try again.');
    } finally {
      setSavingStage(false);
    }
  }, [selectedPlant, currentStageKey, savingStage, syncStageKey, refreshLogs, showToast]);

  // ── 4. Advance one stage ──────────────────────────────────
  const handleAdvance = useCallback(async () => {
    if (!selectedPlant || savingStage) return;
    setSavingStage(true);
    try {
      const nextKey = await advancePlantStage(selectedPlant.id, currentStageKey);
      if (!nextKey) { showToast('Already at the final stage!'); return; }
      syncStageKey(selectedPlant.id, nextKey);
      await refreshLogs(selectedPlant.id);
      showToast(`Advanced to "${nextKey}"`);
    } catch (err) {
      console.error('Advance error:', err);
      showToast('Failed to advance stage.');
    } finally {
      setSavingStage(false);
    }
  }, [selectedPlant, currentStageKey, savingStage, syncStageKey, refreshLogs, showToast]);

  // ── 5. Retreat one stage ──────────────────────────────────
  const handleRetreat = useCallback(async () => {
    if (!selectedPlant || savingStage) return;
    setSavingStage(true);
    try {
      const prevKey = await retreatPlantStage(selectedPlant.id, currentStageKey);
      if (!prevKey) { showToast('Already at the first stage.'); return; }
      syncStageKey(selectedPlant.id, prevKey);
      await refreshLogs(selectedPlant.id);
      showToast(`Retreated to "${prevKey}"`);
    } catch (err) {
      console.error('Retreat error:', err);
      showToast('Failed to retreat stage.');
    } finally {
      setSavingStage(false);
    }
  }, [selectedPlant, currentStageKey, savingStage, syncStageKey, refreshLogs, showToast]);

  // ── Derived display values ────────────────────────────────
  const days   = selectedPlant ? daysSincePlanted(selectedPlant.plantedDate) : 0;
  const health = selectedPlant
    ? healthStatus(days, masterPlant?.growthDays ?? 0, currentStageIdx)
    : 'On Track';

  // ── Full-page loader ──────────────────────────────────────
  if (loadingList) return <FullPageLoader message="Loading your growth journey" />;

  return (
    <div className="bg-[#fbf8ff] pb-28 md:pb-0 text-zinc-800 min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      
<div className="hidden md:block">
  <SectionHeader />
</div>

<div className="md:hidden">
  <Topbar />
  <MobileSectionNav />
</div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* Page Header */}
        <header className="mb-8 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1b6b51]">Growth Journey</p>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Growth Journey
          </h1>
          <p className="text-sm text-[#47464a]">
            Monitor your botanical assets from germination through harvest.
          </p>
        </header>

        <ErrorBanner message={dataError} />

        {userPlants.length === 0 ? (
          <EmptyGarden onNavigate={() => navigate('/plants')} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Left Panel: Plant List ─────────────────── */}
            <aside className="lg:w-72 flex-shrink-0 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 pl-1">
                Your Plants ({userPlants.length})
              </p>
              {userPlants.map((up) => (
                <PlantSelectorCard
                  key={up.id}
                  userPlant={up}
                  isActive={selectedPlant?.id === up.id}
                  onClick={() => selectPlant(up)}
                />
              ))}
              <button
                onClick={() => navigate('/plants')}
                className="w-full mt-2 px-4 py-2.5 bg-white border border-dashed border-zinc-300 rounded-2xl text-sm font-semibold text-zinc-400 hover:border-emerald-300 hover:text-emerald-600 transition-all"
              >
                + Add More Plants
              </button>
            </aside>

            {/* ── Right Panel: Journey Detail ───────────── */}
            <section className="flex-grow min-w-0">

              {/* Hero card */}
              {selectedPlant && (
                <PlantHeroCard
                  selectedPlant={selectedPlant}
                  masterPlant={masterPlant}
                  health={health}
                  currentStageIdx={currentStageIdx}
                  savingStage={savingStage}
                  onAdvance={handleAdvance}
                  onRetreat={handleRetreat}
                />
              )}

              {/* Stats row */}
              {selectedPlant && (
                <div className="mb-6 flex gap-2 overflow-x-auto [scrollbar-width:none] pb-1">
                  <StatChip icon={<MdCalendarToday />} label="Days Growing"  value={days} />
                  <StatChip icon={<MdEco />}           label="Stage"         value={`${currentStageIdx + 1}/${GROWTH_STAGES.length}`} />
                  <StatChip icon={<MdSpa />}           label="Log Entries"   value={stageLogs.length} />
                  {masterPlant?.growthDays > 0 && (
                    <StatChip icon={<MdScience />}     label="Expected Days" value={masterPlant.growthDays} />
                  )}
                </div>
              )}

              <ErrorBanner message={detailError} />

              {/* Detail area */}
              {loadingDetail ? (
                <DetailSpinner />
              ) : selectedPlant ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <GrowthTimeline
                    currentStageIdx={currentStageIdx}
                    onSelect={handleStageSelect}
                    activeTrackPct={activeTrackPct}
                  />
                  <StageHistoryPanel stageLogs={stageLogs} />
                </div>
              ) : null}

            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}