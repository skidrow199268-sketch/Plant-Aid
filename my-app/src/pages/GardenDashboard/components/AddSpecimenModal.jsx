import { useState, useEffect } from 'react';
import * as Md from 'react-icons/md';
import {fetchPlantCatalog,} from '../services/GardenService.js';

import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import {GROWTH_STAGES} from '../constant/collection.js'

export default function AddSpecimenModal({ userId, onClose, onAdded }) {
  const [plants,        setPlants]        = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [form, setForm] = useState({ plantId: '', nickname: '', currentStage: GROWTH_STAGES[0], plantedDate: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetchPlantCatalog()
      .then((catalog) => { setPlants(catalog); if (catalog.length > 0) set('plantId', catalog[0].id); })
      .catch(console.error)
      .finally(() => setLoadingPlants(false));
  }, []);

  const handleSave = async () => {
    if (!form.nickname.trim()) { setError('Please enter a nickname for your plant.'); return; }
    if (!form.plantId)         { setError('Please select a plant from the catalog.'); return; }
    if (!form.plantedDate)     { setError('Please enter the planted date.'); return; }
    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'userPlants'), {
        userId, plantId: form.plantId, nickname: form.nickname.trim(),
        currentStage: form.currentStage,
        plantedDate:  Timestamp.fromDate(new Date(form.plantedDate)),
        imageUrl: '', createdAt: serverTimestamp(),
      });
      onAdded();
    } catch (err) {
      console.error(err);
      setError('Failed to add plant. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl p-6 space-y-5" style={{ animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#a6f2d1] flex items-center justify-center">
              <Md.MdLocalFlorist className="text-[#237157] text-lg" />
            </div>
            <h2 className="text-lg font-extrabold text-black tracking-tight">New Specimen</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"><Md.MdClose /></button>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Plant</label>
          {loadingPlants ? <div className="h-10 bg-zinc-100 rounded-xl animate-pulse" /> : plants.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">No plants in the catalog yet.</p>
          ) : (
            <select value={form.plantId} onChange={(e) => set('plantId', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-black font-medium focus:outline-none focus:border-[#1b6b51] transition">
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nickname</label>
          <input type="text" value={form.nickname} onChange={(e) => set('nickname', e.target.value)} placeholder="e.g. Sunny, Big Leaf…" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder-zinc-300 focus:outline-none focus:border-[#1b6b51] transition" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Stage</label>
          <select value={form.currentStage} onChange={(e) => set('currentStage', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-black font-medium focus:outline-none focus:border-[#1b6b51] transition">
            {GROWTH_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Planted Date</label>
          <input
            type="date"
            value={form.plantedDate}
            onChange={(e) => set('plantedDate', e.target.value)}
            className="w-full max-w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-[#1b6b51] transition box-border [&::-webkit-date-and-time-value]:text-left"
            style={{ minWidth: 0 }}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Md.MdAdd className="text-base" /> Add Plant</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}