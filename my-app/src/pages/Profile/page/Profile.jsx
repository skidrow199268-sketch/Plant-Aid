// ============================================================
// Profile.jsx
// User profile page for PlantAid. No Firebase Storage.
// ============================================================

import  { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../Auth/Service/AuthContext';
import { Topbar, FullPageLoader, MobileNav } from '../../../components/index';

import {
  fetchUserProfile,
  fetchUserStats,
  updateDisplayName,
  changePassword,
  formatMemberSince,
  getInitials,
} from '../services/ProfileService';

import { MdEdit, MdCalendarToday, MdEmail,MdArrowBack} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { FaSeedling } from 'react-icons/fa6';
import {useNavigate} from 'react-router-dom'
import {Avatar,EditableField,PasswordSection,StatCard,Toast} from '../components/index'

export default function Profile() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid ?? null;
  
  const [profile,         setProfile]         = useState(null);
  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [savingName,      setSavingName]      = useState(false);
  const [savingPassword,  setSavingPassword]  = useState(false);

  const navigate = useNavigate()

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3000,
    );
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const [profileData, statsData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserStats(userId),
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleNameSave = async (newName) => {
    setSavingName(true);
    try {
      await updateDisplayName(userId, newName);
      setProfile((p) => ({ ...p, name: newName }));
      showToast('Name updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update name.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSave = async (currentPw, newPw) => {
    setSavingPassword(true);
    try {
      await changePassword(currentPw, newPw);
      showToast('Password updated.');
    } catch (err) {
      throw err;
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <FullPageLoader message="Loading your profile" />;

  const displayName = profile?.name || currentUser?.displayName || '';
  const email       = profile?.email || currentUser?.email || '';
  const photoURL    = profile?.photoURL || currentUser?.photoURL || '';
  const initials    = getInitials(displayName, email);
  const memberSince = formatMemberSince(profile?.createdAt);

  const isEmailProvider = currentUser?.providerData?.some(
    (p) => p.providerId === 'password',
  );

  const STAT_CARDS = [
    { label: 'Plants',          value: stats?.plants,    icon: FaSeedling,       color: 'bg-[#a6f2d1] text-[#1b6b51]'    },
    { label: 'Journal entries', value: stats?.journals,  icon: IoLeaf,           color: 'bg-[#e8f5e9] text-emerald-700'  },
    { label: 'Reminders',       value: stats?.reminders, icon: MdCalendarToday,  color: 'bg-[#f4f2fd] text-[#6c5ce7]'    },
    { label: 'Plant scans',     value: stats?.scans,     icon: MdEdit,           color: 'bg-amber-50 text-amber-600'     },
  ];

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b22] min-h-screen flex flex-col antialiased selection:bg-[#a6f2d1] selection:text-[#1b6b51]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="hidden lg:block"><Topbar /></div>
      <div className="block lg:hidden"><MobileNav /></div>

      <main className="flex-grow w-full max-w-3xl mx-auto px-4 md:px-6 py-10 pb-28 lg:pb-10 space-y-8">
        
        <button
      onClick={()=> navigate('/dashboard')}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[#c8c5ca]/40 hover:bg-zinc-50 active:scale-90 transition-all"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <MdArrowBack className="text-lg text-[#1a1b22]" />
    </button>


        <div className="flex items-center gap-2 text-[#1b6b51]">
          <IoLeaf className="text-base" />
          <span className="text-xs font-bold uppercase tracking-widest">Account</span>
        </div>


        {/* Hero card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/60 dark:border-zinc-700/60 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-zinc-900/20 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar photoURL={photoURL} initials={initials} />

          <div className="flex-1 min-w-0 space-y-1.5">
            <EditableField value={displayName} onSave={handleNameSave} saving={savingName} />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 text-xs text-[#47464a]">
                <MdEmail className="text-sm text-zinc-400" />
                {email}
              </span>
              {memberSince && (
                <span className="flex items-center gap-1.5 text-xs text-[#47464a]">
                  <MdCalendarToday className="text-sm text-zinc-400" />
                  {memberSince}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {currentUser?.providerData?.map((p) => (
                <span
                  key={p.providerId}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#f4f2fd] text-[#6c5ce7] border border-[#e8e4fb]"
                >
                  {p.providerId === 'password' ? 'Email' : p.providerId.replace('.com', '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#47464a] mb-3">
            Garden at a glance
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_CARDS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* Account settings */}
        <section className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#47464a]">
            Account settings
          </p>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-700/60 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-zinc-900/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#e8f5e9] flex items-center justify-center flex-shrink-0">
                <MdEmail className="text-emerald-600 text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-black">Email address</p>
                <p className="text-xs text-[#47464a] truncate mt-0.5">{email}</p>
              </div>
              <span className="ml-auto text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full flex-shrink-0">
                Read-only
              </span>
            </div>
          </div>

          {isEmailProvider && (
            <PasswordSection onSave={handlePasswordSave} saving={savingPassword} />
          )}
        </section>

      </main>

      <Toast toast={toast} />
    </div>
  );
}