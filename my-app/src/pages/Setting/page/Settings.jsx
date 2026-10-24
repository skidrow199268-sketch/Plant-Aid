// ============================================================
// PlantAidSettingsView.jsx
// Settings and Weather Suite — connected to Firestore.
// Reads/writes users/{uid} via SettingsService.
// ============================================================

import  { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, MobileNav } from '../../../components/index';
import {
  loadSettingsData,
  DEFAULT_SETTINGS,
} from '../services/Setting';

import {
  fetchWeather,
  fetchForecast,
  getUserLocation,

} from '../../DashboardToday/services/DashboardServices.js';

import { MdErrorOutline,} from 'react-icons/md';

import {BotanicalSummary,DeveloperModal,HelpModal,HighWindAlert,LogoutModal,LocationSetting,
  NotificationsModal,ProfileModal,SettingsMenu,TermsModal,WeatherForecast,Footer
} from '../components/index.js'





// ─────────────────────────────────────────────────────────────
// Main – PlantAidSettingsView
// ─────────────────────────────────────────────────────────────
export default function PlantAidSettingsView() {
  const { currentUser } = useAuth();
  const uid             = currentUser?.uid ?? null;

  const [profile,        setProfile]        = useState(null);
  const [settings,       setSettings]       = useState({ ...DEFAULT_SETTINGS });
  const [weather,        setWeather]        = useState(null);
  const [forecast,       setForecast]       = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const [activeModal, setActiveModal] = useState(null);

  // Weather bundle loader — reused for initial load and whenever
  // the user pins a new location in LocationSetting.
  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const location = await getUserLocation();
      // Forecast failure is non-fatal: the current-weather card still works.
      const [w, f] = await Promise.all([
        fetchWeather(location.lat, location.lon, location.name, location.country),
        fetchForecast(location.lat, location.lon).catch((err) => {
          console.warn('Forecast fetch failed (non-fatal):', err);
          return null;
        }),
      ]);
      setWeather(w);
      setForecast(f);
    } catch (err) {
      console.warn('Weather fetch failed (non-fatal):', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const handleLocationChanged = useCallback(() => {
    loadWeather();
  }, [loadWeather]);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { profile: p } = await loadSettingsData(uid);
        setProfile(p);
        if (p?.settings) setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
      } catch (err) {
        console.error('Settings load error:', err);
        setError('Could not load your settings. Please check your connection.');
      } finally {
        setLoading(false);
      }
    })();

    loadWeather();
  }, [uid, loadWeather]);

  const openModal  = (name) => setActiveModal(name);
  const closeModal = ()     => setActiveModal(null);

  const handleProfileSaved  = useCallback((updates) => {
    setProfile((prev) => prev ? { ...prev, ...updates } : updates);
  }, []);

  const handleSettingsSaved = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  if (loading) return <FullPageLoader message="Loading settings suite" />;

  return (
    <>


      <div
        className="min-h-screen flex flex-col text-[#1a1b22] bg-[#fbf8ff] md:m-6"
        style={{ animation: 'fadeIn 0.4s ease-in-out' }}
      >
        <Topbar />
        <div className="block lg:hidden">
  <MobileNav/>
</div>

        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-14 pb-28 md:pb-8">

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
              <MdErrorOutline className="flex-shrink-0 text-lg" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">

            {/* Left — Weather */}
            <section className="lg:col-span-7 space-y-4 sm:space-y-5">
              <HighWindAlert weather={weather} />
              <WeatherForecast weather={weather} forecast={forecast} weatherLoading={weatherLoading} />
              <BotanicalSummary weather={weather} />
              <LocationSetting onChanged={handleLocationChanged} />
            </section>

            {/* Right — Settings */}
            <section className="lg:col-span-5">
              <SettingsMenu onOpen={openModal} profileName={profile?.name} />
            </section>

          </div>
        </main>

        <Footer onOpen={openModal} />

        {/* Modals */}
        <ProfileModal
          isOpen={activeModal === 'profile'}
          onClose={closeModal}
          profile={profile}
          uid={uid}
          onProfileSaved={handleProfileSaved}
        />
        <NotificationsModal
          isOpen={activeModal === 'notifications'}
          onClose={closeModal}
          settings={settings}
          uid={uid}
          onSettingsSaved={handleSettingsSaved}
        />
        <DeveloperModal isOpen={activeModal === 'developer'} onClose={closeModal} />
        <TermsModal     isOpen={activeModal === 'terms'}     onClose={closeModal} />
        <HelpModal      isOpen={activeModal === 'help'}      onClose={closeModal} />
        <LogoutModal    isOpen={activeModal === 'logout'}    onClose={closeModal} />
      </div>
    </>
  );
}