import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/Service/AuthContext';
import { FullPageLoader, SectionHeader, MobileSectionNav, Topbar, Footer } from '../../../components/index';

import {
  MdOutlineWaterDrop,
  MdThermostat,

} from 'react-icons/md';


import {
  loadUpcomingData,
  fetchUserPlantsForForm,
  markReminderComplete,
  
  deleteReminder,
  
} from '../services/UpcomingService';

import {HeroSection,TimelineItem,Toast,UpcomingPanel} from '../component/index'


export default function PlantAidUpcomingPreview() {

  const { currentUser } = useAuth();
  const userId          = currentUser?.uid ?? null;

  const [upcoming,   setUpcoming]   = useState([]);
  const [overdue,    setOverdue]    = useState([]);
  const [userPlants, setUserPlants] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reloading,  setReloading]  = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  const [toast,       setToast]       = useState({ message: '', visible: false });
  const toastTimerRef                 = useRef(null);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message: msg, visible: true });
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2500,
    );
  }, []);

  // ── Full initial load ─────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!userId) { setLoading(false); return; }

    if (silent) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    try {
      const [screenData, plants] = await Promise.all([
        loadUpcomingData(userId),
        fetchUserPlantsForForm(userId),
      ]);
      setUpcoming(screenData.upcoming);
      setOverdue(screenData.overdue);
      setUserPlants(plants);
      if (silent) showToast('Reminders refreshed!');
    } catch (err) {
      console.error('Load error:', err);
      showToast('Failed to load reminders.');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [userId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Reload (silent refresh — no spinner overlay) ─────────
  const handleReload = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // ── Complete ──────────────────────────────────────────────
  const handleComplete = useCallback(async (reminderId) => {
    // Optimistic remove from both lists
    setUpcoming((prev) => prev.filter((r) => r.id !== reminderId));
    setOverdue ((prev) => prev.filter((r) => r.id !== reminderId));
    try {
      await markReminderComplete(reminderId);
      showToast('Marked as complete!');
    } catch (err) {
      console.error(err);
      await loadData(true);
      showToast('Failed to update reminder.');
    }
  }, [showToast, loadData]);

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = useCallback(async (reminderId) => {
    setUpcoming((prev) => prev.filter((r) => r.id !== reminderId));
    setOverdue ((prev) => prev.filter((r) => r.id !== reminderId));
    try {
      await deleteReminder(reminderId);
      showToast('Reminder deleted.');
    } catch (err) {
      console.error(err);
      await loadData(true);
      showToast('Failed to delete reminder.');
    }
  }, [showToast, loadData]);

  // ── Modal saved ───────────────────────────────────────────
  const handleModalSaved = useCallback(async (msg) => {
    setShowModal(false);
    await loadData(true);
    showToast(msg);
  }, [loadData, showToast]);

  if (loading) return <FullPageLoader message="Loading your care schedule" />;

  return (
    <div
      className="bg-[#fbf8ff] dark:bg-[#0f0f0f] pb-28 md:pb-0 text-[#1a1b22] dark:text-gray-100 min-h-screen flex flex-col"
     
    >
      {/* Topbar — your reusable component */}
     {/* Desktop topbar — hidden on small screens */}
<div className="hidden md:block">
  <SectionHeader />
</div>

<div className="md:hidden">
  <Topbar />
</div>

<div className="block lg:hidden">
  <MobileSectionNav/>
</div>

      {/* Main — original bento grid layout */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left column ──────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Hero */}
      <HeroSection/>

          {/* Stat Cards — live Firestore data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-[#c8c5ca]/40 shadow-[0_8px_30px_rgba(0,0,0,0.02)] min-h-44 flex flex-col justify-between">
              <div>
                <MdOutlineWaterDrop className="text-xl text-[#1b6b51]" />
                <h3
                  className="font-bold mt-2 text-[17px]"
                 
                >
                  Upcoming Tasks
                </h3>
              </div>
              <div
                className="text-3xl font-bold text-black dark:text-white"
               
              >
                {upcoming.length}
                <span className="text-sm font-medium text-[#47464a] ml-1">reminders</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#c8c5ca]/40 shadow-[0_8px_30px_rgba(0,0,0,0.02)] min-h-44 flex flex-col justify-between">
              <div>
                <MdThermostat className="text-xl text-[#1b6b51]" />
                <h3
                  className="font-bold mt-2 text-[17px]"
                 
                >
                  Overdue
                </h3>
              </div>
              <div
                className={`text-3xl font-bold ${overdue.length > 0 ? 'text-amber-500' : 'text-black dark:text-white'}`}
               
              >
                {overdue.length}
                <span className="text-sm font-medium text-[#47464a] ml-1">
                  {overdue.length === 0 ? 'all clear' : 'need attention'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column — live timeline panel ─────────── */}
        <aside className="lg:col-span-4 h-full lg:min-h-[520px]">
          <UpcomingPanel
            items={[...overdue, ...upcoming]}
            overdueCount={overdue.length}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onAdd={() => setShowModal(true)}
            onReload={handleReload}
            reloading={reloading}
          />
        </aside>
      </main>

      {/* Footer */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}