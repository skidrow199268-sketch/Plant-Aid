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

// ── Design tokens (kept inline; consider lifting to tailwind.config) ──
// paper #F5F6F0 · card #FFFFFF · border #E4E1D3
// ink #212B22 · ink-muted #6E7568
// fern #3F6B4A · gold #A9812F · rust #A14B36

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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F0] px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-md bg-[#FBF3DF] border-2 border-dashed border-[#3F6B4A]/40 flex items-center justify-center mx-auto mb-6">
            <IoLeaf className="text-4xl text-[#3F6B4A]" />
          </div>
          <h2 className="text-2xl font-serif font-semibold text-[#212B22] tracking-tight">Not in your garden</h2>
          <p className="text-[#6E7568] text-sm mt-2 leading-relaxed">
            Add this plant from the directory first to start tracking it here.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-[#212B22] text-[#F5F6F0] px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] transition-colors"
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
    <div className="bg-[#F5F6F0] min-h-screen font-sans text-[#212B22] flex flex-col antialiased selection:bg-[#3F6B4A]/20 selection:text-[#212B22]">

      {/* ── Top Nav ── */}
      <header className="w-full h-16 bg-white border-b border-[#E4E1D3] sticky top-0 z-40 flex items-center px-4 md:px-6">
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-sm hover:bg-[#F5F6F0] flex items-center justify-center transition-colors"
            >
              <MdArrowBack className="text-[#212B22] text-xl" />
            </button>
            <div className="h-5 w-px bg-[#E4E1D3]" />
            <div className="flex items-center gap-2">
              <IoLeaf className="text-[#3F6B4A] text-xl" />
              <span className="text-xl font-serif font-semibold text-[#212B22] tracking-tight">PlantAid</span>
            </div>
          </div>

          {/* Actions in nav on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2 border border-[#E4E1D3] bg-white text-[#212B22] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-[#3F6B4A] hover:text-[#3F6B4A] transition-colors">
              {uploading
                ? <span className="w-3.5 h-3.5 border-2 border-[#E4E1D3] border-t-[#3F6B4A] rounded-full animate-spin" />
                : <MdEdit className="text-sm" />}
              {uploading ? 'Uploading…' : 'Update Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              onClick={() => setActiveTab('journal')}
              className="flex items-center gap-2 bg-[#212B22] text-[#F5F6F0] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] transition-colors"
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
          <div className="mb-6 bg-[#F7E9E5] border border-[#A14B36]/30 text-[#A14B36] text-sm rounded-sm px-4 py-3 flex items-center gap-2">
            <MdErrorOutline className="flex-shrink-0 text-lg" /> {error}
          </div>
        )}

        {/* ── Hero: specimen label card ── */}
        <header className="mb-10 relative bg-white border border-[#E4E1D3] rounded-md p-6">
          {/* corner ticks */}
          <span className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#3F6B4A]/50" />
          <span className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#3F6B4A]/50" />

          <div className="flex items-start gap-5">
            {/* Plant image / placeholder */}
            <div className="flex-shrink-0">
              {hasValidImg ? (
               <img
  src={displayImg}
  alt={displayName}
  onError={() => setImgError(true)}
  className="w-20 h-20 md:w-24 md:h-24 rounded-md object-cover border border-[#E4E1D3]"
/>
              ) : (
                <PlantPlaceholder size="lg" />
              )}
            </div>

            {/* Title block */}
            <div className="flex-grow min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#212B22] tracking-tight truncate">
                  {displayName}
                </h1>
                <StagePill stage={userPlant.currentStage} />
              </div>
              {scientificName && (
                <p className="text-xs text-[#6E7568] font-mono uppercase tracking-widest">{scientificName}</p>
              )}
              <p className="text-xs text-[#6E7568] font-mono mt-1.5">
                {String(days).padStart(3, '0')} {days === 1 ? 'DAY' : 'DAYS'} SINCE PLANTING
              </p>
            </div>
          </div>

          {/* Mobile actions below header */}
          <div className="flex items-center gap-2 mt-5 md:hidden">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 border border-[#E4E1D3] bg-white text-[#212B22] py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:border-[#3F6B4A] hover:text-[#3F6B4A] transition-colors">
              {uploading
                ? <span className="w-3.5 h-3.5 border-2 border-[#E4E1D3] border-t-[#3F6B4A] rounded-full animate-spin" />
                : <MdEdit className="text-sm" />}
              {uploading ? 'Uploading…' : 'Update Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <button
              onClick={() => setActiveTab('journal')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#212B22] text-[#F5F6F0] py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] transition-colors"
            >
              <GiNotebook className="text-sm" />
              Log Growth
            </button>
          </div>
        </header>

        {/* ── Tab bar — index-tab style ── */}
        <div className="flex items-center gap-6 border-b border-[#E4E1D3] mb-8 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max pb-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? 'border-[#3F6B4A] text-[#212B22]'
                  : 'border-transparent text-[#6E7568] hover:text-[#212B22]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="min-h-[500px]">
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
      <footer className="bg-white border-t border-[#E4E1D3] flex flex-col items-center gap-2 w-full px-6 py-6 mt-12">
        <div className="flex items-center gap-1.5 mb-1">
          <IoLeaf className="text-[#3F6B4A] text-lg" />
          <span className="text-sm font-serif font-semibold text-[#212B22]">PlantAid</span>
        </div>
        <div className="flex gap-6">
          <a className="text-[#6E7568] hover:text-[#3F6B4A] transition-colors text-xs" href="#">Sign up</a>
          <a className="text-[#6E7568] hover:text-[#3F6B4A] transition-colors text-xs" href="#">Privacy Policy</a>
          <a className="text-[#6E7568] hover:text-[#3F6B4A] transition-colors text-xs" href="#">Help Center</a>
        </div>
        <p className="text-[11px] text-[#6E7568]/60 font-mono mt-1">
          © {new Date().getFullYear()} PLANTAID · BOTANICAL PRECISION
        </p>
      </footer>
    </div>
  );
}