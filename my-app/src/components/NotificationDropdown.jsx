import React, { useState, useEffect, useRef } from 'react';
import { MdOutlineNotificationsNone } from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Watering Reminder',   message: 'Your Monstera needs water today.',   time: '10m ago',    unread: true  },
    { id: 2, title: 'Fertilizer Alert',    message: 'Time to feed your Snake Plant.',      time: '2h ago',     unread: true  },
    { id: 3, title: 'Repotting Milestone', message: 'Tomatoes are ready for larger beds.', time: '2 days ago', unread: false },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
   
    setIsOpen((o) => !o);
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n)),
    );
  };

  return (
    <>
      {/* KEY FIX: portal-style — dropdown renders OUTSIDE the header stacking context */}
      <div className="relative" ref={dropdownRef}>

        {/* Trigger */}
        <button
          onClick={handleToggle}
          type="button"
          className={`relative w-[34px] h-[34px] rounded-lg border flex items-center justify-center text-[#47464a] hover:bg-[#f0eff9] transition-colors focus:outline-none ${
            isOpen ? 'bg-[#f0eff9] border-[#1b6b51]/40' : 'border-[#c8c5ca]/40'
          }`}
        >
          <MdOutlineNotificationsNone className="text-base" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1b6b51] rounded-full border-[1.5px] border-white" />
          )}
        </button>

        {/* Dropdown — fixed position breaks out of sticky header stacking context */}
        {isOpen && (
          <div
            className="fixed w-80 bg-white dark:bg-[#1a1a1a] border border-neutral-200/70 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              animation: 'fadeDown 0.15s ease-out',
              // Position it below the header (60px) on the right side
              top: '68px',
              right: (() => {
                if (!dropdownRef.current) return '16px';
                const rect = dropdownRef.current.getBoundingClientRect();
                return `${window.innerWidth - rect.right}px`;
              })(),
              zIndex: 9999,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <span
                  className="text-[14px] font-bold text-neutral-900"
                 
                >
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-[#e6f9f1] text-[#1b6b51] text-[11px] px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-[#1b6b51] font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-neutral-100">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs font-medium text-neutral-400">All caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => toggleRead(notif.id)}
                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer relative ${
                      notif.unread ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      notif.unread ? 'bg-[#e6f9f1] text-[#1b6b51]' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      <IoLeaf className="text-sm" />
                    </div>

                    <div className="flex-grow min-w-0 pr-3">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs font-bold truncate ${notif.unread ? 'text-neutral-900' : 'text-neutral-500'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-neutral-400 flex-shrink-0">{notif.time}</span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${notif.unread ? 'text-neutral-600' : 'text-neutral-400'}`}
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {notif.unread && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1b6b51]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}