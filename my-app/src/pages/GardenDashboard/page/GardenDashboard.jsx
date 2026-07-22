import React, { useState, useEffect, useCallback } from 'react';
import * as Md from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, MobileNav, Footer } from '../../../components/index';

import {
  loadGardenDashboard,
  completeReminder,
  uncompleteReminder,
  
} from '../services/GardenService.js';

import { isReminderDone } from '../utils/gardenUtils.jsx';
import {AddSpecimenModal,CareScheduleList,ClimateControlModal,FeaturedPlantCard,
  QuickActions,StatCards,WeatherStrip
} from '../components/index.js'

export default function GardenDashboard() {
  const { userProfile, currentUser } = useAuth();
  const navigate    = useNavigate();
  const userId      = currentUser?.uid;
  const displayName = userProfile?.name || currentUser?.displayName || 'Botanist';
  const firstName   = displayName.split(' ')[1] || displayName.split(' ')[0];

  const [gardenData, setGardenData] = useState({
    userPlants: [], featuredPlant: null, todayReminders: [],
    stats: { totalPlants: 0, healthScorePct: 100, healthyCount: 0, sickCount: 0, warningCount: 0 },
  });
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showClimateModal, setShowClimateModal] = useState(false);

  // NEW: which plant the featured card is currently showing.
  // null = fall back to gardenData.featuredPlant (most recent).
  const [selectedPlant, setSelectedPlant] = useState(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setGardenData(await loadGardenDashboard(userId));
      setSelectedPlant(null); // reset selection on fresh load
    } catch (err) {
      console.error('Garden dashboard load error:', err);
      setError('Could not load garden data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleReminder = useCallback(async (reminder) => {
    const wasDone = isReminderDone(reminder);
    setGardenData((prev) => ({
      ...prev,
      todayReminders: prev.todayReminders.map((r) => {
        if (r.id !== reminder.id) return r;
        return typeof r.completed === 'boolean'
          ? { ...r, completed: !wasDone }
          : { ...r, status: wasDone ? 'PENDING' : 'COMPLETED' };
      }),
    }));
    try {
      if (wasDone) await uncompleteReminder(reminder.id);
      else         await completeReminder(reminder.id);
    } catch (err) {
      console.error('Toggle reminder error:', err);
      setGardenData((prev) => ({
        ...prev,
        todayReminders: prev.todayReminders.map((r) => {
          if (r.id !== reminder.id) return r;
          return typeof r.completed === 'boolean'
            ? { ...r, completed: wasDone }
            : { ...r, status: wasDone ? 'COMPLETED' : 'PENDING' };
        }),
      }));
    }
  }, []);

  const handleSpecimenAdded = useCallback(() => {
    setShowAddModal(false);
    loadData();
  }, [loadData]);

  if (loading) return <FullPageLoader message="Garden is loading, please wait" />;

  const { userPlants, featuredPlant, todayReminders, stats } = gardenData;
  const pendingCount   = todayReminders.filter((r) => !isReminderDone(r)).length;
  const displayedPlant = selectedPlant || featuredPlant; // NEW

  return (
    <div className="bg-zinc-50/60 min-h-screen text-[#1a1b22] antialiased overflow-x-hidden">

      <Topbar />
      <MobileNav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-10 space-y-5 ">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Page header ─────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1b6b51]">Overview</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1b22] mt-0.5">My Garden</h2>
            <p className="text-xs text-[#47464a] mt-0.5">
              Welcome back, {firstName} · <strong>{stats.totalPlants}</strong> plant{stats.totalPlants !== 1 ? 's' : ''} · <strong>{stats.healthScorePct}%</strong> health
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-80 active:scale-95 transition-all shadow-sm"
          >
            <Md.MdAdd className="text-sm" />
            <p className={'hidden lg:block md:block'}>New Specimen</p>
          </button>
        </header>

        {/* ── Weather strip ────────────────────────────────── */}
        <WeatherStrip />

        {/* ── Stat cards ───────────────────────────────────── */}
        <StatCards stats={stats} pendingCount={pendingCount} navigate={navigate} />

        {/* ── Main 2-col layout ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: featured plant */}
          <div className="lg:col-span-3">
            <FeaturedPlantCard
              plant={displayedPlant}
              allPlants={userPlants}
              onSelectPlant={setSelectedPlant}
              navigate={navigate}
            />
          </div>

          {/* Right: care schedule + quick actions */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <CareScheduleList
              reminders={todayReminders}
              onToggle={handleToggleReminder}
              navigate={navigate}
            />
            <QuickActions onClimate={() => setShowClimateModal(true)} navigate={navigate} />
          </div>
        </div>
      </main>

      {/* Footer */}
     {/* Footer */}
<div className="pb-16 md:pb-0">
  <Footer />
</div>

      {/* Modals */}
      {showAddModal && (
        <AddSpecimenModal userId={userId} onClose={() => setShowAddModal(false)} onAdded={handleSpecimenAdded} />
      )}
      {showClimateModal && (
        <ClimateControlModal onClose={() => setShowClimateModal(false)} />
      )}
    </div>
  );
}