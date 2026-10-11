import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../Auth/Service/AuthContext';
import {
  loadDashboardData,
  completeReminder,
} from '../services/DashboardServices.js';

 'react-icons/md';
import {CalendarCard,DailyCare,MyPlantsStrip,UpcomingTasks,WeatherInsight} from '../components/index'
import { Footer, MobileNav, Topbar, FullPageLoader } from '../../../components/index';




// ─────────────────────────────────────────────────────────────
// Main – DashboardToday
// ─────────────────────────────────────────────────────────────
export default function DashboardToday() {
  const { userProfile, currentUser } = useAuth();
  const displayName = userProfile?.name || currentUser?.displayName || 'there';
  const firstName   = displayName.split(' ')[0];
  const userId      = currentUser?.uid;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
                'Good evening';

  // ── Dashboard data state ─────────────────────────────────
  const [dashData, setDashData] = useState({
    userPlants:        [],
    todayReminders:    [],
    upcomingReminders: [],
    recentJournals:    [],
  });
  const [loadingData, setLoadingData] = useState(true);
  const [dataError,   setDataError]   = useState(null);

  // ── Load Firestore data on mount ─────────────────────────
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoadingData(true);
      setDataError(null);
      try {
        const data = await loadDashboardData(userId);
        setDashData(data);
      } catch (err) {
        console.error('Dashboard data error:', err);
        setDataError('Failed to load dashboard data. Please check your connection and refresh.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [userId]);

  // ── Complete a reminder (optimistic update) ──────────────
  const handleCompleteReminder = useCallback(async (reminderId) => {
    setDashData((prev) => ({
      ...prev,
      todayReminders: prev.todayReminders.map((r) =>
        r.id === reminderId ? { ...r, status: 'COMPLETED' } : r,
      ),
    }));

    try {
      await completeReminder(reminderId);
    } catch (err) {
      console.error('Could not complete reminder:', err);
      setDashData((prev) => ({
        ...prev,
        todayReminders: prev.todayReminders.map((r) =>
          r.id === reminderId ? { ...r, status: 'PENDING' } : r,
        ),
      }));
    }
  }, []);

  // ── Show full-page loader while Firebase is fetching ─────
  if (loadingData) {
    return <FullPageLoader message="Loading your garden" />;
  }

  return (
    <div className="bg-[#fbf8ff] text-[#1a1b22] pb-28 md:pb-8 min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Topbar/>
      <div className="block md:hidden">
  <MobileNav />
</div>

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 py-10 w-full ">
        {/* Editorial Header */}
        <header className="mb-8 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1b6b51]">Today</p>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="text-sm text-[#47464a]">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </header>

        {/* Error banner */}
        {dataError && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            {dataError}
          </div>
        )}

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          <WeatherInsight />

          {dashData.userPlants.length > 0 && (
            <MyPlantsStrip userPlants={dashData.userPlants} />
          )}

          <CalendarCard  todayReminders={dashData.todayReminders} />
          <DailyCare
            todayReminders={dashData.todayReminders}
            onComplete={handleCompleteReminder}
          />
          <UpcomingTasks upcomingReminders={dashData.upcomingReminders} />
        </div>
      </main>

      <Footer />
    </div>
  );
}