import React, { useState } from 'react';

import {
  MdAddCircleOutline,
  MdClose,
  MdOutlineWaterDrop,
  MdOutlineEco,
  MdOutlineBuild,
  MdOutlineEdit,
} from 'react-icons/md';

import {
  fetchUserPlantsForForm,
  createReminder,
  datetimeLocalToTimestamp,
  REMINDER_TYPES,
  REMINDER_TYPE_LABELS,
} from '../pages/UpcomingPreview/services/UpcomingService';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  WATER:     <MdOutlineWaterDrop />,
  FERTILIZE: <MdOutlineEco />,
  REPOT:     <MdOutlineBuild />,
  CUSTOM:    <MdOutlineEdit />,
};

const TYPE_STYLES = {
  WATER:     { color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200'     },
  FERTILIZE: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  REPOT:     { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  CUSTOM:    { color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200'  },
};

export default function AddReminderModal({ userId, onClose }) {
  const [userPlants,    setUserPlants]    = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [form, setForm] = useState({
    userPlantId:      '',
    title:            '',
    type:             'WATER',
    reminderDate:     '',
    customPlantName:  '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [saved,  setSaved]  = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Load user's plants when modal opens
  React.useEffect(() => {
    if (!userId) { setLoadingPlants(false); return; }
    fetchUserPlantsForForm(userId)
      .then((plants) => {
        setUserPlants(plants);
        if (plants.length > 0) set('userPlantId', plants[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingPlants(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (form.userPlantId === '__custom__' && !form.customPlantName?.trim()) {
      setError('Please enter a custom plant name.'); return;
    }
    if (!form.title.trim())  { setError('Please enter a title.'); return; }
    if (!form.reminderDate)  { setError('Please choose a date and time.'); return; }
    if (!form.userPlantId)   { setError('Please select a plant.'); return; }
    setSaving(true);
    setError('');
    try {
      await createReminder({
        userId,
        userPlantId:      form.userPlantId === '__custom__' ? null : form.userPlantId,
        customPlantName:  form.userPlantId === '__custom__' ? form.customPlantName?.trim() : null,
        title:            form.title.trim(),
        type:             form.type,
        reminderDate:     datetimeLocalToTimestamp(form.reminderDate),
      });
      setSaved(true);
      window.dispatchEvent(new CustomEvent('reminder:created'));
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error(err);
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto pb-safe-bottom"
        style={{ animation: 'fadeUp 0.2s ease-out' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-base sm:text-lg font-bold text-black dark:text-white tracking-tight"
           
          >
            New Reminder
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eeedf7] flex items-center justify-center text-[#47464a] hover:bg-[#e0dff0] transition-colors"
          >
            <MdClose />
          </button>
        </div>

        {/* Success state */}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <span className="text-emerald-600 text-sm font-bold">✓ Reminder saved!</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* Plant selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Plant</label>
          {loadingPlants ? (
            <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" />
          ) : userPlants.length === 0 ? (
            <p className="text-sm text-[#47464a] italic">No plants in your garden yet.</p>
          ) : (
            <>
              <select
                value={form.userPlantId}
                onChange={(e) => set('userPlantId', e.target.value)}
                className="w-full bg-[#fbf8ff] dark:bg-zinc-800 border border-[#c8c5ca]/60 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-black dark:text-white font-medium focus:outline-none focus:border-[#1b6b51] transition"
              >
                {userPlants.map((up) => (
                  <option key={up.id} value={up.id}>{up.nickname}</option>
                ))}
                <option value="__custom__">+ Add custom plant...</option>
              </select>

              {form.userPlantId === '__custom__' && (
                <input
                  type="text"
                  value={form.customPlantName || ''}
                  onChange={(e) => set('customPlantName', e.target.value)}
                  placeholder="e.g. My Sunflower"
                  className="w-full bg-[#fbf8ff] dark:bg-zinc-800 border border-[#c8c5ca]/60 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-black dark:text-white placeholder-[#c8c5ca] dark:placeholder-zinc-500 focus:outline-none focus:border-[#1b6b51] transition mt-2"
                />
              )}
            </>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Water the tomatoes"
            className="w-full bg-[#fbf8ff] dark:bg-zinc-800 border border-[#c8c5ca]/60 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-black dark:text-white placeholder-[#c8c5ca] dark:placeholder-zinc-500 focus:outline-none focus:border-[#1b6b51] transition"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Type</label>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {REMINDER_TYPES.map((t) => {
              const s = TYPE_STYLES[t];
              const isActive = form.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type', t)}
                  className={`flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${
                    isActive
                      ? `${s.bg} ${s.border} ${s.color}`
                      : 'bg-[#fbf8ff] border-[#c8c5ca]/60 text-[#47464a] hover:border-[#c8c5ca]'
                  }`}
                >
                  <span className="text-sm sm:text-base">{TYPE_ICONS[t]}</span>
                  <span className="truncate max-w-full px-0.5">{REMINDER_TYPE_LABELS[t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Date & Time</label>
          <input
            type="datetime-local"
            value={form.reminderDate}
            onChange={(e) => set('reminderDate', e.target.value)}
            className="w-full bg-[#fbf8ff] dark:bg-zinc-800 border border-[#c8c5ca]/60 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-[#1b6b51] transition"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 rounded-xl border border-[#c8c5ca]/60 text-sm font-bold text-[#47464a] hover:bg-[#eeedf7] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 py-2.5 sm:py-3 rounded-xl bg-black text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
           
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><MdAddCircleOutline className="text-base" /> Save</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}