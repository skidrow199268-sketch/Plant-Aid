// ============================================================
// LocationSetting.jsx
// Lets the user pin an exact weather location (city search or a
// precise GPS fix). A saved location overrides IP/GPS auto-
// detection everywhere weather is shown in the app.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import * as Md from 'react-icons/md';

import {
  getHomeLocation,
  saveHomeLocation,
  clearHomeLocation,
  searchLocationOptions,
  reverseGeocoding,
  getUserLocation,
} from '../../DashboardToday/services/DashboardServices.js';
import LocationPickerModal from './LocationPickerModal';

// ─────────────────────────────────────────────────────────────
// Main – LocationSetting
// ─────────────────────────────────────────────────────────────
export default function LocationSetting({ onChanged }) {
  const [home,    setHome]    = useState(null);
  const [autoLoc, setAutoLoc] = useState(null); // current auto-detected source info

  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [searching, setSearching] = useState(false);
  const [open,     setOpen]     = useState(false);
  const [locating, setLocating] = useState(false);
  const [error,    setError]    = useState('');
  const [savedFlash, setSavedFlash] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const debounceRef = useRef(null);
  const boxRef      = useRef(null);

  // Load current state: what's saved, and what the auto-chain would pick.
  useEffect(() => {
    (async () => {
      const saved = getHomeLocation();
      setHome(saved);
      if (!saved) {
        const loc = await getUserLocation(); // fresh cache / GPS / IP chain
        setAutoLoc(loc);
      }
    })();
  }, []);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced city search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setError('');
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const options = await searchLocationOptions(query);
        setResults(options);
        setOpen(true);
        if (!options.length) setError('No places matched that search.');
      } catch {
        setError('Location search failed. Please try again.');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const flash = (place) => {
    setSavedFlash(place?.label ?? '');
    setTimeout(() => setSavedFlash(''), 2500);
  };

  const pickPlace = (place) => {
    const saved = saveHomeLocation({
      label:   place.label,
      name:    place.name,
      state:   place.state,
      country: place.country,
      lat:     place.lat,
      lon:     place.lon,
      savedAt: Date.now(),
    });
    setHome(saved);
    setQuery('');
    setResults([]);
    setOpen(false);
    flash(saved);
    onChanged?.('saved', saved);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location detection.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place =
          (await reverseGeocoding(latitude, longitude)) ??
          {
            label: `My location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
            name: '', state: '', country: '',
            lat: latitude, lon: longitude,
          };
        setLocating(false);
        pickPlace(place);
      },
      (err) => {
        setLocating(false);
        setError(
          err?.code === 1 /* PERMISSION_DENIED — browser denies access */
            ? 'Location permission is denied. Search for your city instead.'
            : 'Could not read your location. Search for your city instead.',
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const resetToAuto = () => {
    clearHomeLocation();
    setHome(null);
    flash(null);
    (async () => {
      const loc = await getUserLocation();
      setAutoLoc(loc);
    })();
    onChanged?.('auto', null);
  };

  const displayLabel = home
    ? home.label
    : autoLoc
      ? 'Auto-detected (approximate)'
      : 'Not set';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-[#c8c5ca]/50 dark:border-zinc-700/50 rounded-3xl p-4 sm:p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-zinc-900/20">
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base sm:text-xl font-bold text-black dark:text-white">
            <Md.MdLocationOn className="text-[#1b6b51]" /> Weather Location
          </h2>
          <p className="text-[#47464a] dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
            Pin exactly where your plants live — weather is fetched for this location.
          </p>
        </div>
      </div>

      {/* Current status */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <span className="text-[#47464a] dark:text-zinc-400">Current:</span>
        <span className="font-semibold text-black dark:text-white truncate max-w-full">
          {home ? '📍 ' : ''}{displayLabel}
        </span>
        {savedFlash && (
          <span className="rounded-full bg-[#a6f2d1]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1b6b51]">
            Saved
          </span>
        )}
      </div>

      {/* Search box */}
      <div ref={boxRef} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-[#c8c5ca]/50 dark:border-zinc-700/60 bg-[#fbf8ff] dark:bg-zinc-800 px-3 py-2.5 focus-within:border-[#1b6b51]/60 transition-colors">
          <Md.MdSearch className="text-[#47464a] dark:text-zinc-500 text-lg flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search city or barangay — e.g. Bauan, Batangas"
            className="w-full bg-transparent text-sm text-black dark:text-white placeholder:text-[#c8c5ca] focus:outline-none"
          />
          {searching && (
            <span className="w-4 h-4 border-2 border-[#1b6b51]/30 border-t-[#1b6b51] rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Results dropdown */}
        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#c8c5ca]/50 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.25)]">
            {results.map((place, i) => (
              <li key={`${place.lat}-${place.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => pickPlace(place)}
                  className="w-full text-left px-4 py-2.5 text-sm text-black dark:text-white hover:bg-[#a6f2d1]/15 dark:hover:bg-[#a6f2d1]/10 transition-colors"
                >
                  <Md.MdPlace className="inline-block mr-1.5 text-[#1b6b51]" />
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1b6b51] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#15523e] disabled:opacity-60"
        >
          <Md.MdMyLocation className={locating ? 'animate-spin' : ''} />
          {locating ? 'Locating…' : 'Use my current location'}
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#a6f2d1]/40 px-4 py-2 text-xs font-bold text-[#1b6b51] transition-colors hover:bg-[#a6f2d1]/60"
        >
          <Md.MdList /> Browse PH locations
        </button>

        {home && (
          <button
            type="button"
            onClick={resetToAuto}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c8c5ca]/60 px-4 py-2 text-xs font-bold text-[#47464a] dark:text-zinc-300 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Md.MdAutorenew /> Reset to auto-detect
          </button>
        )}
      </div>

      {/* Philippines-only cascading picker */}
      <LocationPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={(place) => {
          setPickerOpen(false);
          pickPlace(place);
        }}
      />

      {error && (
        <p className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
          <Md.MdErrorOutline /> {error}
        </p>
      )}
      {home && !error && (
        <p className="mt-3 text-[11px] text-[#1b6b51] font-medium">
          Saved locations are remembered even after you close the browser.
        </p>
      )}
    </div>
  );
}
