import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/Auth/Service/AuthContext';

import {
  MdAddCircleOutline,
} from 'react-icons/md';

import { NAV_ITEMS } from '../constant/sectionNavList';
import { AddReminderModal } from './index';

const STORAGE_KEY = 'plantaid_active_route';

export default function MobileSectionNav() { 
  const { currentUser } = useAuth();
  const userId = currentUser?.uid ?? null;
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  const [activeRoute, setActiveRoute] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || location.pathname;
  });

  const handleClose = useCallback(() => setShowModal(false), []);

  // ── Sync active route with current path ───────────────────
  useEffect(() => {
    setActiveRoute(location.pathname);
    localStorage.setItem(STORAGE_KEY, location.pathname);
  }, [location.pathname]);

  const handleLinkClick = (path) => {
    setActiveRoute(path);
    localStorage.setItem(STORAGE_KEY, path);
    navigate(path);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-[#c8c5ca]/30 dark:border-zinc-700 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] z-40 pb-safe">
        <nav className="flex items-stretch h-16 w-full max-w-md mx-auto px-1">

          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleLinkClick(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform duration-150 no-underline"
                style={{ WebkitTapHighlightColor: 'transparent', fontFamily: "'Manrope', sans-serif" }}
              >
                <span
                  className={`absolute top-1 w-1 h-1 rounded-full bg-[#1b6b51] transition-opacity duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <span
                  className={`flex items-center justify-center w-10 h-6 rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-[#a6f2d1]' : ''
                  }`}
                >
                  <Icon
                    className={`text-[21px] transition-colors duration-200 ${
                      isActive ? 'text-[#1b6b51]' : 'text-zinc-400'
                    }`}
                  />
                </span>

                <span
                  className={`text-[10.5px] leading-none tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-[#1b6b51] font-semibold' : 'text-zinc-400 font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Add New button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform duration-150"
            style={{ WebkitTapHighlightColor: 'transparent', fontFamily: "'Manrope', sans-serif" }}
          >
            <span className="flex items-center justify-center w-10 h-6 rounded-full transition-colors duration-200 hover:bg-[#a6f2d1]/40">
              <MdAddCircleOutline className="text-[19px] text-[#1b6b51]" />
            </span>
            <span className="text-[10.5px] leading-none tracking-tight font-semibold text-[#1b6b51]">
              
            </span>
          </button>

        </nav>
      </div>

      {showModal && (
        <AddReminderModal
          userId={userId}
          onClose={handleClose}
        />
      )}
    </>
  );
}