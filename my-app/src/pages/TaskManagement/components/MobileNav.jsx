// ============================================================
// MobileTaskNav.jsx
// Bottom navigation bar for the Task Manager page.
// Mirrors MobileSectionNav pattern — anchored at bottom, mobile only.
// ============================================================

import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  MdAddCircleOutline,
} from 'react-icons/md';
import { NAV_ITEMS } from '../../../constant/sectionNavList';



export default function MobileNav({ setModalOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#c8c5ca]/30 h-[64px] z-40 px-4 pb-safe">
      <nav className="flex items-center justify-between h-full w-full max-w-md mx-auto">

        {/* Nav links */}
        {NAV_ITEMS.map(({ key, name, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => handleNav(path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-[#1b6b51] font-bold' : 'text-[#47464a]'
              }`}
            >
              <Icon className="text-xl" />
              
            </button>
          );
        })}

        {/* Add Task CTA */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[#47464a] hover:text-[#1b6b51] active:scale-95 transition-all"
        >
          <MdAddCircleOutline className="text-xl text-[#1b6b51]" />
          <span
            className="text-[10px] mt-0.5 font-medium tracking-tight text-[#1b6b51]"
           
          >
   
          </span>
        </button>

      </nav>
    </div>
  );
}