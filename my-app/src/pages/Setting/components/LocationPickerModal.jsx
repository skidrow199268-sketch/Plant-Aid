// ============================================================
// LocationPickerModal.jsx
// Philippines-only location picker — cascading dropdowns built
// from the official PSA (PSGC) dataset bundled in
// src/data/philippines-locations.json. No runtime API needed to
// browse; coordinates are resolved via OpenWeatherMap Geocoding
// on confirm (geocodePHPlace).
//
// Flow: Region → Province → City/Municipality (+ name filter)
//       → "Use this location" → onPicked({label, name, state,
//         country, lat, lon})
// ============================================================

import { useState, useMemo, useEffect } from 'react';
import * as Md from 'react-icons/md';

import Modal from './Modal';
import { geocodePHPlace } from '../../DashboardToday/services/DashboardServices.js';

import phData from '../../../data/philippines-locations.json';

const PH_COUNTRY = 'PH';

export default function LocationPickerModal({ isOpen, onClose, onPicked }) {
  const [regionCode,   setRegionCode]   = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [filter,       setFilter]       = useState('');
  const [placing,      setPlacing]      = useState(false);
  const [error,        setError]        = useState('');

  // Reset the picker each time it opens.
  useEffect(() => {
    if (isOpen) {
      setRegionCode('');
      setProvinceCode('');
      setFilter('');
      setError('');
    }
  }, [isOpen]);

  const provinces = useMemo(
    () => phData.provinces.filter((p) => !regionCode || p.regionCode === regionCode),
    [regionCode],
  );

  const places = useMemo(() => {
    let list = phData.places;
    if (provinceCode) {
      list = list.filter((x) => x.provinceCode === provinceCode);
    } else if (regionCode) {
      // Cities/municipalities under the region — includes the region's
      // independent cities, which don't belong to any province.
      const regionProvinceCodes = new Set(
        phData.provinces.filter((p) => p.regionCode === regionCode).map((p) => p.code),
      );
      list = list.filter(
        (x) => x.regionCode === regionCode || regionProvinceCodes.has(x.provinceCode),
      );
    }
    const q = filter.trim().toLowerCase();
    if (q) list = list.filter((x) => x.name.toLowerCase().includes(q));
    return list;
  }, [regionCode, provinceCode, filter]);

  const provinceById = useMemo(() => {
    const map = new Map(phData.provinces.map((p) => [p.code, p]));
    return (code) => map.get(code) ?? null;
  }, []);
  const regionById = useMemo(() => {
    const map = new Map(phData.regions.map((r) => [r.code, r]));
    return (code) => map.get(code) ?? null;
  }, []);

  const selectClasses = `
    w-full bg-[#fbf8ff] dark:bg-zinc-800 text-sm text-black dark:text-white
    rounded-2xl border border-[#c8c5ca]/50 dark:border-zinc-700/60
    px-3 py-2.5 focus:outline-none focus:border-[#1b6b51]/60 transition-colors
  `;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose your location">
      <p className="text-[#47464a] dark:text-zinc-400 text-xs mb-4">
        Philippine locations only — narrowing from region down to your city or municipality gives the most accurate weather.
      </p>

      {/* Step 1 — Region */}
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#47464a] dark:text-zinc-400 mb-1.5">
        Region
      </label>
      <select
        value={regionCode}
        onChange={(e) => {
          const next = e.target.value;
          setRegionCode(next);
          // Keep the province only if it still belongs to the region.
          const keep = provinceCode && provinces.some((p) => p.code === provinceCode);
          if (!next || !keep) setProvinceCode('');
        }}
        className={selectClasses}
      >
        <option value="">All regions</option>
        {phData.regions.map((r) => (
          <option key={r.code} value={r.code}>{r.label}</option>
        ))}
      </select>

      {/* Step 2 — Province */}
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#47464a] dark:text-zinc-400 mb-1.5 mt-4">
        Province
      </label>
      <select
        value={provinceCode}
        onChange={(e) => setProvinceCode(e.target.value)}
        className={selectClasses}
      >
        <option value="">
          {regionCode ? 'All of province / no province needed' : 'All provinces'}
        </option>
        {provinces.map((p) => (
          <option key={p.code} value={p.code}>{p.name}</option>
        ))}
      </select>

      {/* Step 3 — City / Municipality filter */}
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#47464a] dark:text-zinc-400 mb-1.5 mt-4">
        City / Municipality {places.length ? `(${places.length})` : ''}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-[#c8c5ca]/50 dark:border-zinc-700/60 bg-[#fbf8ff] dark:bg-zinc-800 px-3 py-2.5 focus-within:border-[#1b6b51]/60 transition-colors">
        <Md.MdSearch className="text-[#47464a] dark:text-zinc-500 text-lg flex-shrink-0" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Quick filter — e.g. Bauan"
          className="w-full bg-transparent text-sm text-black dark:text-white placeholder:text-[#c8c5ca] focus:outline-none"
        />
      </div>

      {/* Results list */}
      <div className="mt-3 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/60 max-h-64 overflow-y-auto divide-y divide-[#c8c5ca]/20 dark:divide-zinc-700/40">
        {places.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-[#c8c5ca]">
            No match — try clearing the province or region first.
          </p>
        )}
        {places.slice(0, 300).map((x) => {
          const province = provinceById(x.provinceCode);
          const subtitle = province?.name ?? regionById(x.regionCode)?.label ?? '';
          return (
            <button
              key={`${x.provinceCode}-${x.name}-${x.regionCode}`}
              type="button"
              onClick={async () => {
                setPlacing(true);
                setError('');
                try {
                  const region = regionById(x.regionCode);
                  const { lat, lon } = await geocodePHPlace({
                    name: x.name,
                    provinceName: province?.name ?? '',
                    regionName: region?.label ?? '',
                  });
                  onPicked?.({
                    label: [x.name, subtitle, PH_COUNTRY].filter(Boolean).join(', '),
                    name: x.name,
                    state: subtitle,
                    country: PH_COUNTRY,
                    lat,
                    lon,
                  });
                } catch (err) {
                  console.error('Location resolve failed:', err);
                  setError(err?.message || 'Could not resolve that location. Please try again.');
                } finally {
                  setPlacing(false);
                }
              }}
              disabled={placing}
              className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-2 text-sm text-black dark:text-white hover:bg-[#a6f2d1]/15 dark:hover:bg-[#a6f2d1]/10 transition-colors disabled:opacity-50"
            >
              <span className="min-w-0 truncate">{x.name}</span>
              <span className="text-[10px] text-[#47464a] dark:text-zinc-500 flex-shrink-0 truncate max-w-[50%]">{subtitle}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
          <Md.MdErrorOutline /> {error}
        </p>
      )}
      {placing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[#1b6b51] font-medium">
          <span className="w-4 h-4 border-2 border-[#1b6b51]/30 border-t-[#1b6b51] rounded-full animate-spin" />
          Resolving coordinates…
        </div>
      )}
    </Modal>
  );
}
