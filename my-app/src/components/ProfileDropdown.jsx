import { useRef, useState, useEffect } from 'react';
import { MdFeedback, MdStar, MdStarBorder, MdSend, MdClose } from 'react-icons/md';

import {
  MdAccountCircle,
  MdSettings,
  MdLogout,
} from 'react-icons/md';

import { useAuth } from '../pages/Auth/Service/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaJournalWhills, FaTasks, FaUserAstronaut } from 'react-icons/fa';


import {FeedbackModal} from './index'


export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);
  const { logout, userProfile, currentUser } = useAuth();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName  = userProfile?.name     || currentUser?.displayName || 'User';
  const displayEmail = userProfile?.email    || currentUser?.email       || '';
  const photoURL     = userProfile?.photoURL || currentUser?.photoURL    || null;
  const initials     = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const AvatarCircle = ({ size = 'w-10 h-10' }) => (
    <div className={`${size} rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border border-zinc-200 shrink-0`}>
      {photoURL
        ? <img alt={displayName} className="w-full h-full object-cover" src={photoURL} />
        : <span className="text-sm font-extrabold text-emerald-700">{initials}</span>
      }
    </div>
  );

  const navItems = [
    { label: 'View Profile',    icon: <MdAccountCircle className="text-zinc-400 group-hover:text-emerald-600 transition-colors text-[20px]" />, path: '/profile' },
    { label: 'Settings',        icon: <MdSettings      className="text-zinc-400 group-hover:text-emerald-600 transition-colors text-[20px]" />, path: '/settings' },
    { label: 'My Collection',   icon: <FaUserAstronaut className="text-zinc-400 group-hover:text-emerald-600 transition-colors text-[18px]" />, path: '/collection' },
    { label: 'My Journal',      icon: <FaJournalWhills className="text-zinc-400 group-hover:text-emerald-600 transition-colors text-[18px]" />, path: '/journal' },
    { label: 'Task Management', icon: <FaTasks         className="text-zinc-400 group-hover:text-emerald-600 transition-colors text-[18px]" />, path: '/task-management' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {photoURL
          ? <img alt={displayName} className="w-full h-full object-cover" src={photoURL} />
          : <span className="text-sm font-extrabold text-emerald-700">{initials}</span>
        }
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel
              Mobile  : fixed bottom sheet
              Desktop : fixed top-right, positioned via inline style
                        so it's immune to any parent stacking context (fixed headers, transforms, etc.) */}
          <div
            className="z-50 bg-white flex flex-col overflow-hidden fixed bottom-16 left-0 right-0 rounded-t-3xl shadow-2xl max-h-[85dvh] sm:bottom-auto sm:left-auto sm:right-auto sm:top-auto sm:w-64 sm:rounded-2xl sm:border sm:border-zinc-200/80 sm:shadow-xl sm:shadow-zinc-900/10"
            style={{
              // on desktop override: pin to viewport, not to any parent
              ...(window.innerWidth >= 640 && {
                position: 'fixed',
                top: '72px',
                right: '16px',
                left: 'auto',
                bottom: 'auto',
                maxHeight: 'min(420px, calc(100vh - 80px))',
              })
            }}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-200" />
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-zinc-100 flex items-center gap-3 flex-shrink-0">
              <AvatarCircle />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-900 truncate">{displayName}</p>
                <p className="text-xs text-zinc-400 truncate">{displayEmail}</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors sm:hidden flex-shrink-0">
                <MdClose className="text-zinc-500 text-lg" />
              </button>
            </div>

            {/* Scrollable nav */}
            <div className="overflow-y-auto flex-1 min-h-0 p-2 space-y-0.5">
              {navItems.map(({ label, icon, path }) => (
                <button key={path} onClick={() => { setOpen(false); navigate(path); }}
                  className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-left text-sm text-zinc-700 font-medium hover:bg-zinc-50 active:bg-zinc-100 transition-colors group">
                  {icon}{label}
                </button>
              ))}
              <button onClick={() => { setOpen(false); setShowFeedback(true); }}
                className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-left text-sm text-zinc-700 font-medium hover:bg-zinc-50 active:bg-zinc-100 transition-colors group">
                <MdFeedback className="text-zinc-400 group-hover:text-emerald-600 transition-colors text-[20px]" />
                Send Feedback
              </button>
            </div>

            {/* Sign out */}
            <div className="p-2 border-t border-zinc-100 flex-shrink-0">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-left text-sm font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors">
                <MdLogout className="text-red-400 text-[20px]" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userEmail={displayEmail}
      />
    </div>
  );
}