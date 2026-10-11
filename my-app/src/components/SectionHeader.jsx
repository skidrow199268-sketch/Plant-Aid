// ============================================================
// SectionHeader.jsx  (Topbar for desktop)
// Self-contained reusable top navigation bar for PlantAid.
// Drop in <Topbar /> anywhere — no props needed.
// Handles its own auth, reminders, login history, Add Reminder modal.
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../pages/Auth/Service/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Notification, AddReminderModal } from './index';

import { subscribeNotifications, markReminderCompleted , checkAndNotifyOverdueReminders} from '../service/notificationService';
import { subscribeLoginHistory } from '../pages/Auth/Service/LoginHistory';

import {
  MdSearch,
  MdAddCircleOutline,
  MdNotificationsActive,
} from 'react-icons/md';
import { TbPlant2 } from 'react-icons/tb';

import { NAV_ITEMS } from '../constant/sectionNavList';


export default function SectionHeader() {
  const { currentUser } = useAuth();
  const userId          = currentUser?.uid ?? null;

  // ── Add Reminder modal ────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const handleClose = useCallback(() => setShowModal(false), []);

  // ── Hash-based active route ───────────────────────────────
// ── Active route tracking ──────────────────────────────────
const location = useLocation();
const navigate  = useNavigate();
const [activeRoute, setActiveRoute] = useState(() => location.pathname);

useEffect(() => {
  setActiveRoute(location.pathname);
}, [location.pathname]);

  // ── Notification state ────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [reminders,         setReminders]         = useState([]);
  const [loginHistory,      setLoginHistory]      = useState([]);
  const [notifLoading,      setNotifLoading]      = useState(true);
  const [dismissing,        setDismissing]        = useState(null);

  const notifRef = useRef(null);

  // ── Real-time reminders listener ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setNotifLoading(true);
    const unsub = subscribeNotifications(currentUser.uid, (data) => {
      setReminders(data);
      setNotifLoading(false);
    });
    return () => unsub();
  }, [currentUser]);


  // ── Overdue email alert check ──────────────────────────────
  useEffect(() => {
    if (!currentUser || reminders.length === 0) return;
    checkAndNotifyOverdueReminders(reminders, {
      userId:  currentUser.uid,
      toEmail: currentUser.email,
      toName:  currentUser.displayName,
    });
  }, [currentUser, reminders]);

  // ── Real-time login history listener ──────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeLoginHistory(currentUser.uid, (data) => {
      setLoginHistory(data);
    });
    return () => unsub();
  }, [currentUser]);

  // ── Close notification panel on outside click ─────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Dismiss (complete) a reminder ─────────────────────────
  const handleDismiss = async (id) => {
    setDismissing(id);
    try {
      await markReminderCompleted(id);
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
    } finally {
      setDismissing(null);
    }
  };

  const unreadCount = reminders.filter((n) => n.unread).length;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40">
        <header className="bg-white dark:bg-[#1a1a1a] border-b border-[#c8c5ca]/30 dark:border-zinc-700/50 w-full h-[60px] flex items-center px-6">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-[30px] h-[30px] bg-[#1b6b51] rounded-lg flex items-center justify-center flex-shrink-0">
                <TbPlant2 className="text-[#a6f2d1] text-base" />
              </div>
              <span
                className="text-[17px] font-bold text-black dark:text-white tracking-[-0.03em]"
               
              >
                PlantAid
              </span>
            </div>

            {/* Nav — dynamically mapped with active state */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeRoute === item.path;
                return (
                  <a
                    key={item.key}
                    href={item.path}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'font-bold text-black dark:text-white bg-[#f0eff9] dark:bg-zinc-800'
                        : 'text-[#47464a] hover:bg-[#f0eff9]'
                    }`}
                  >
                    {item.name}
                  </a>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">

              {/* Search */}
              <button className="w-[34px] h-[34px] rounded-lg border border-[#c8c5ca]/40 flex items-center justify-center text-[#47464a] hover:bg-[#f0eff9] transition-colors">
                <MdSearch className="text-base" />
              </button>

              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className={`w-[34px] h-[34px] rounded-lg border border-[#c8c5ca]/40 flex items-center justify-center text-[#47464a] hover:bg-[#f0eff9] transition-colors relative ${
                    showNotifications ? 'bg-[#f0eff9]' : ''
                  }`}
                >
                  <MdNotificationsActive className="text-base" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#1b6b51] rounded-full border-2 border-white" />
                  )}
                </button>

                {showNotifications && (
                  <Notification
                    onClose={() => setShowNotifications(false)}
                    reminders={reminders}
                    loginHistory={loginHistory}
                    loading={notifLoading}
                    onDismiss={handleDismiss}
                    dismissing={dismissing}
                  />
                )}
              </div>

              {/* Add Reminder */}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 h-[34px] bg-[#1b6b51] text-white text-[13px] font-bold rounded-lg hover:bg-[#164f3c] active:scale-95 transition-all"
               
              >
                <MdAddCircleOutline className="text-sm " />
                <p className="hidden lg:block">Add Reminder</p>
              </button>

            </div>
          </div>
        </header>
      </div>

       <div className="h-[60px]" />

      {/* Add Reminder modal */}
      {showModal && (
        <AddReminderModal
          userId={userId}
          onClose={handleClose}
        />
      )}
    </>
  );
}