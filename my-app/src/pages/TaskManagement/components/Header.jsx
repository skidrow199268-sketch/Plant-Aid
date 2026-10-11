import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IoLeaf } from 'react-icons/io5';
import { MdAdd } from 'react-icons/md';
import { ProfileDropdown } from '../../../components/index';
import { NAV_ITEMS } from '../../../constant/sectionNavList';



const STORAGE_KEY = 'plantaid_active_route';

export default function TasksHeader({ setModalOpen }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [activeRoute, setActiveRoute] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || location.pathname;
  });

  useEffect(() => {
    setActiveRoute(location.pathname);
    localStorage.setItem(STORAGE_KEY, location.pathname);
  }, [location.pathname]);

  const handleNavigate = (path) => {
    setActiveRoute(path);
    localStorage.setItem(STORAGE_KEY, path);
    navigate(path);
  };

  return (
    <header className="bg-[#fbf8ff] w-full h-16 flex items-center justify-center px-4 md:px-6 border-b border-[#c8c5ca]/40 fixed top-0 left-0 z-50">
      <div className="flex items-center justify-between w-full max-w-7xl">

        {/* Brand */}
        <div
          onClick={() => handleNavigate('/')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <IoLeaf className="text-[#1b6b51] text-2xl" />
          <span
            className="text-2xl font-bold text-black dark:text-white tracking-tight"
           
          >
            PlantAid
          </span>
        </div>

        {/* Nav links — desktop only */}
      <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {NAV_ITEMS.map(({ name, path }) => {
            const isActive = activeRoute === path;
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={`text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-black dark:text-white font-bold border-b-2 border-[#1b6b51] pb-0.5'
                    : 'text-[#47464a] font-medium hover:text-black'
                }`}
              >
                {name}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-[#1b6b51] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95"
          >
            <MdAdd className="text-base" />
            Schedule Task
          </button>

          <ProfileDropdown />
        </div>

      </div>
    </header>
  );
}