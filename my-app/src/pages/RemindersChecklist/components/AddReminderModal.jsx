import { useState, } from 'react';


import {
  MdAddCircleOutline,
  MdClose,
 
} from 'react-icons/md';

import {
  
  createReminder,

  REMINDER_TYPES,
  REMINDER_TYPE_LABELS,
  datetimeLocalToTimestamp,
} from '../services/ReminderService';

import {TYPE_ICONS,TYPE_STYLES} from '../constant/reminder.jsx'



export default function AddReminderModal({ userId, userPlants, onClose, onSaved }) {
  const [form, setForm] = useState({
    userPlantId:  userPlants[0]?.id ?? '',
    title:        '',
    type:         'WATER',
    reminderDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Please enter a title.'); return; }
    if (!form.reminderDate) { setError('Please choose a date and time.'); return; }
    if (!form.userPlantId)  { setError('Please select a plant.'); return; }
    setSaving(true);
    setError('');
    try {
      await createReminder({
        userId,
        userPlantId:  form.userPlantId,
        title:        form.title.trim(),
        type:         form.type,
        reminderDate: datetimeLocalToTimestamp(form.reminderDate),
      });
      onSaved('Reminder added!');
    } catch (err) {
      console.error(err);
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto" style={{ animation: 'fadeUp 0.2s ease-out' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black tracking-tight">New Reminder</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#eeedf7] flex items-center justify-center text-[#47464a] hover:bg-[#e0dff0] transition-colors"><MdClose /></button>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Plant</label>
          {userPlants.length === 0 ? <p className="text-sm text-[#47464a] italic">No plants yet.</p> : (
            <select value={form.userPlantId} onChange={(e) => set('userPlantId', e.target.value)} className="w-full bg-[#fbf8ff] border border-[#c8c5ca]/60 rounded-xl px-3 py-2.5 text-sm text-black font-medium focus:outline-none focus:border-[#1b6b51] transition">
              {userPlants.map((up) => <option key={up.id} value={up.id}>{up.nickname}</option>)}
            </select>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Title</label>
          <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Water the tomatoes" className="w-full bg-[#fbf8ff] border border-[#c8c5ca]/60 rounded-xl px-3 py-2.5 text-sm text-black placeholder-[#c8c5ca] focus:outline-none focus:border-[#1b6b51] transition" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Type</label>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {REMINDER_TYPES.map((t) => {
              const s = TYPE_STYLES[t];
              const isActive = form.type === t;
              return (
                <button key={t} type="button" onClick={() => set('type', t)} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all ${isActive ? `${s.bg} ${s.border} ${s.color}` : 'bg-[#fbf8ff] border-[#c8c5ca]/60 text-[#47464a] hover:border-[#c8c5ca]'}`}>
                  <span className="text-base">{TYPE_ICONS[t]}</span>
                  <span className="truncate max-w-full px-0.5">{REMINDER_TYPE_LABELS[t]}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#47464a]">Date & Time</label>
          <input type="datetime-local" value={form.reminderDate} onChange={(e) => set('reminderDate', e.target.value)} className="w-full bg-[#fbf8ff] border border-[#c8c5ca]/60 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-[#1b6b51] transition" />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#c8c5ca]/60 text-sm font-bold text-[#47464a] hover:bg-[#eeedf7] transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1b6b51] text-white text-sm font-bold hover:bg-[#164f3c] disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MdAddCircleOutline className="text-base" /> Save Reminder</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
