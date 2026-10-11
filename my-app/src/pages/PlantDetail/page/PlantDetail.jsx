import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdArrowBack,
  MdEdit,
  MdErrorOutline,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { GiNotebook } from 'react-icons/gi';
import { useAuth } from '../../Auth/Service/AuthContext';
import { FullPageLoader } from '../../../components/index';
import {
  loadPlantDetailsData,
  daysSincePlanted,
  updateUserPlant,
} from '../services/PlantDetailService';
import { findUserPlant } from '../../PlantDirectory/services/PlantService';
import {
  BotanicalSpecsView,
  CareRemindersView,
  JournalLogsView,
  ProgressView,
  PlantPlaceholder,
  StagePill
} from '../components/index';

import {TABS} from '../constant/detail'

// ── Design tokens (shared app theme) ──
// surface #fbf8ff · card #FFFFFF · border #c8c5ca
// ink #1a1b22 · muted #47464a
// brand #1b6b51 · brand-hover #237157 · danger #ef4444

// ── Main ─────────────────────────────────────────────────────
export default function PlantDetails() {
  const { plantId }     = useParams();
  const navigate        = useNavigate();
  const { currentUser } = useAuth();
  const userId          = currentUser?.uid;

  const [activeTab,   setActiveTab]   = useState('progress');
  const [data,        setData]        = useState(null);
  const [userPlantId, setUserPlantId] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [imgError,    setImgError]    = useState(false);

  const loadData = useCallback(async () => {
    if (!userId || !plantId) return;
    try {
      const userPlantDoc = await findUserPlant(userId, plantId);
      if (!userPlantDoc) {
        setData(null);
        setUserPlantId(null);
        setError(null);
        return;
      }
      const resolvedId = userPlantDoc.id;
      setUserPlantId(resolvedId);
      const result = await loadPlantDetailsData(resolvedId, userId);
      setData(result);
      setError(null);
      setImgError(false);
    } catch (err) {
      console.error('PlantDetails load error:', err);
      setError('Could not load plant data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [userId, plantId]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userPlantId) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
    setUploading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      await updateUserPlant(userPlantId, { imageUrl: base64 });
      setImgError(false);
      await loadData();
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Failed to save image. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <FullPageLoader message="Loading plant details, please wait" />;

  // ── Not in garden state ──────────────────────────────────
  if (!data?.userPlant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf8ff] px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-md bg-[#e8f8f1] border-2 border-dashed border-[#1b6b51]/40 flex items-center justify-center mx-auto mb-6">
            <IoLeaf className="text-4xl text-[#1b6b51]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1a1b22] tracking-tight">Not in your garden</h2>
          <p className="text-[#47464a] text-sm mt-2 leading-relaxed">
            Add this plant from the directory first to start tracking it here.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-[#1a1b22] text-[#fbf8ff] px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#1b6b51] transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const { userPlant, masterPlant, reminders, journals } = data;
  const displayName    = userPlant.nickname || masterPlant?.name || 'My Plant';
  const scientificName = masterPlant?.scientificName || '';
  const days           = daysSincePlanted(userPlant.plantedDate);
  const displayImg = userPlant?.imageUrl?.startsWith('data:')
  ? userPlant.imageUrl       // user uploaded a custom base64 photo
  : masterPlant?.imageUrl;   // fall back to catalog image

const hasValidImg = displayImg && !imgError;

  return (
    <div className="bg-[#fbf8ff] min-h-screen font-sans text-[#1a1b22] flex flex-col antialiased selection:bg-[#1b6b51]/20 selection:text-[#1a1b22]">

      {/* ── Top Nav ── */}
      <header className="w-full h-16 bg-white border-b border-[#c8c5ca] sticky top-0 z-40 flex items-center px-4 md:px-6">
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-sm hover:bg-[#fbf8ff] flex items-center justify-center transition-colors"
            >
              <MdArrowBack className="text-[#1a1b22] text-xl" />
            </button>
            <div className="h-5 w-px bg-[#c8c5ca]" />
            <div className="flex items-center gap-2">
              <IoLeaf className="text-[#1b6b51] text-xl" />
              <span className="text-xl font-semibold text-[#1a1b22] tracking-tight">PlantAid</span>
            </div>
          </div>

          {/* Actions in nav on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2 border border-[#c8c5ca] bg-white text-[#1a1b22] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-[#1b6b51] hover:text-[#1b6b51] transition-colors">
              {uploading
                ? <span className="w-3.5 h-3.5 border-2 border-[#c8c5ca] border-t-[#1b6b51] rounded-full animate-spin" />
                : <MdEdit className="text-sm" />}
              {uploading ? 'Uploading…' : 'Update Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              onClick={() => setActiveTab('journal')}
              className="flex items-center gap-2 bg-[#1a1b22] text-[#fbf8ff] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#1b6b51] transition-colors"
            >
              <GiNotebook className="text-sm" />
              Log Growth
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-6 py-10">

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-[#fef2f2] border border-[#ef4444]/30 text-[#ef4444] text-sm rounded-sm px-4 py-3 flex items-center gap-2">
            <MdErrorOutline className="flex-shrink-0 text-lg" /> {error}
          </div>
        )}

        {/* ── Hero: specimen label card ── */}
        <header className="mb-10 relative bg-white border border-[#c8c5ca] rounded-md p-6">
          {/* corner ticks */}
          <span className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#1b6b51]/50" />
          <span className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#1b6b51]/50" />

          <div className="flex items-start gap-4 sm:gap-5">
            {/* Plant image / placeholder */}
            <div className="flex-shrink-0">
              {hasValidImg ? (
               <img
  src={displayImg}
  alt={displayName}
  onError={() => setImgError(true)}
  className="w-20 h-20 md:w-24 md:h-24 rounded-md object-cover border border-[#c8c5ca]"
/>
              ) : (
                <PlantPlaceholder size="lg" />
              )}
            </div>

            {/* Title block */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#1a1b22] tracking-tight break-words">
                  {displayName}
                </h1>
                <StagePill stage={userPlant.currentStage} />
              </div>
              {scientificName && (
                <p className="text-xs text-[#47464a] uppercase tracking-widest">{scientificName}</p>
              )}
              <p className="text-xs text-[#47464a] mt-1.5">
                {String(days).padStart(3, '0')} {days === 1 ? 'DAY' : 'DAYS'} SINCE PLANTING
              </p>
            </div>
          </div>

          {/* Mobile actions below header */}
          <div className="flex items-center gap-2 mt-5 md:hidden">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 border border-[#c8c5ca] bg-white text-[#1a1b22] py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-[#1b6b51] hover:text-[#1b6b51] transition-colors">
              {uploading
                ? <span className="w-3.5 h-3.5 border-2 border-[#c8c5ca] border-t-[#1b6b51] rounded-full animate-spin" />
                : <MdEdit className="text-sm" />}
              {uploading ? 'Uploading…' : 'Update Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              onClick={() => setActiveTab('journal')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a1b22] text-[#fbf8ff] py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#1b6b51] transition-colors"
            >
              <GiNotebook className="text-sm" />
              Log Growth
            </button>
          </div>
        </header>

        {/* ── Tab bar — index-tab style ── */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[#c8c5ca] mb-8 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max pb-3 border-b-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1b6b51] text-[#1a1b22]'
                  : 'border-transparent text-[#47464a] hover:text-[#1a1b22]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="min-h-[320px] md:min-h-[500px]">
          {activeTab === 'progress' && (
            <ProgressView masterPlant={masterPlant} userPlant={userPlant} journals={journals} />
          )}
          {activeTab === 'care' && (
            <CareRemindersView reminders={reminders} userId={userId} userPlantId={userPlantId} onRefresh={loadData} />
          )}
          {activeTab === 'journal' && (
            <JournalLogsView journals={journals} userId={userId} userPlantId={userPlantId} onRefresh={loadData} />
          )}
          {activeTab === 'specs' && (
            <BotanicalSpecsView masterPlant={masterPlant} />
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#c8c5ca] flex flex-col items-center gap-2 w-full px-6 py-6 mt-12">
        <div className="flex items-center gap-1.5 mb-1">
          <IoLeaf className="text-[#1b6b51] text-lg" />
          <span className="text-sm font-semibold text-[#1a1b22]">PlantAid</span>
        </div>
        <div className="flex gap-6">
          <a className="text-[#47464a] hover:text-[#1b6b51] transition-colors text-xs" href="#">Sign up</a>
          <a className="text-[#47464a] hover:text-[#1b6b51] transition-colors text-xs" href="#">Privacy Policy</a>
          <a className="text-[#47464a] hover:text-[#1b6b51] transition-colors text-xs" href="#">Help Center</a>
        </div>
        <p className="text-[11px] text-[#47464a]/60 mt-1">
          © {new Date().getFullYear()} PLANTAID · BOTANICAL PRECISION
        </p>
      </footer>
    </div>
  );
}