import  { useState, useEffect, useCallback, useRef } from 'react';

import {
  categoryToType,
 
} from '../services/TaskManagerService';

// React Icons
import {
  MdClose,
  MdCalendarMonth,

  MdErrorOutline,
  
  MdExpandMore,
} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import {CATEGORIES,CATEGORY_COLORS} from '../constant/taskCategories'

export default function TaskModal({ userPlants, onClose, onSave, saving }) {
  const [category,     setCategory]     = useState('water');
  const [taskName,     setTaskName]     = useState('');
  const [date,         setDate]         = useState('');
  const [timeVal,      setTimeVal]      = useState('');
  const [notes,        setNotes]        = useState('');
  const [userPlantId,  setUserPlantId]  = useState('');
  const [plantOpen,    setPlantOpen]    = useState(false);
  const [validErr,     setValidErr]     = useState('');
  const [closing,      setClosing]      = useState(false);
  const plantRef = useRef(null);

  // Close plant dropdown on outside click
  useEffect(() => {
    function h(e) { if (plantRef.current && !plantRef.current.contains(e.target)) setPlantOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  const handleSave = () => {
    if (!taskName.trim()) { setValidErr('Please enter a task name.'); return; }
    if (!date)            { setValidErr('Please select a date.');      return; }
    if (!timeVal)         { setValidErr('Please select a time.');      return; }
    setValidErr('');

    const reminderDate = new Date(`${date}T${timeVal}`);
    onSave({
      title:        taskName,
      type:         categoryToType(category),
      reminderDate,
      userPlantId,
      notes,
    });
  };

  const selectedPlant = userPlants.find((p) => p.id === userPlantId);

  return (
    <div
      className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={close}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: scale(0.95) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes slideDown { from { opacity: 1; transform: scale(1) translateY(0) } to { opacity: 0; transform: scale(0.95) translateY(12px) } }
      `}</style>

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 overflow-hidden max-h-[92vh] overflow-y-auto"
        style={{ animation: closing ? 'slideDown 0.2s cubic-bezier(0.16,1,0.3,1) forwards' : 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c8c5ca]/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#a6f2d1] flex items-center justify-center">
              <MdCalendarMonth className="text-[#1b6b51] text-base" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
              Schedule Care Task
            </h2>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e8e7f1] transition-colors"
          >
            <MdClose className="text-[#47464a] text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">

          {/* Validation error */}
          {validErr && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              <MdErrorOutline className="flex-shrink-0" /> {validErr}
            </div>
          )}

          {/* Category pills */}
          <div>
            <label className="block text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Task Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const IconComp = c.icon;
                const clr      = CATEGORY_COLORS[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`h-10 px-4 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-all duration-200 ${
                      category === c.id
                        ? 'bg-[#1b6b51] text-white border-[#1b6b51] font-semibold'
                        : `${clr.bg} ${clr.text} ${clr.border} hover:border-[#1b6b51]`
                    }`}
                  >
                    <IconComp className="text-[18px]" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task name */}
          <div>
            <label className="block text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Task Name</label>
            <input
              type="text"
              className="w-full h-12 bg-[#f4f2fd] border-none rounded-xl px-4 text-sm placeholder:text-[#78767b] focus:outline-none focus:ring-4 focus:ring-[#1b6b51]/10 transition-all"
              placeholder="e.g. Sunday Deep Hydration"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Date</label>
              <input
                type="date"
                className="w-full h-12 bg-[#f4f2fd] border-none rounded-xl px-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#1b6b51]/10 transition-all"
                style={{ colorScheme: 'light' }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Time</label>
              <input
                type="time"
                className="w-full h-12 bg-[#f4f2fd] border-none rounded-xl px-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#1b6b51]/10 transition-all"
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
              />
            </div>
          </div>

          {/* Plant selector */}
          <div ref={plantRef}>
            <label className="block text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Link to Plant (optional)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPlantOpen(!plantOpen)}
                className="w-full h-12 bg-[#f4f2fd] border-none rounded-xl px-4 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-[#1b6b51]/10 transition-all"
              >
                <span className={selectedPlant ? 'text-[#1a1b22] font-medium' : 'text-[#78767b]'}>
                  {selectedPlant?.nickname || 'No plant linked'}
                </span>
                <MdExpandMore className="text-[#47464a] text-lg flex-shrink-0" />
              </button>

              {plantOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-[#c8c5ca]/60 dark:border-zinc-700 z-20 overflow-hidden max-h-44 overflow-y-auto">
                  <div
                    onClick={() => { setUserPlantId(''); setPlantOpen(false); }}
                    className="px-4 py-3 text-sm text-[#47464a] hover:bg-zinc-50 cursor-pointer flex items-center gap-2"
                  >
                    <IoLeaf className="text-[#1b6b51] text-sm" />
                    No plant linked
                  </div>
                  {userPlants.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-400 italic">No plants in your garden yet.</div>
                  ) : (
                    userPlants.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => { setUserPlantId(p.id); setPlantOpen(false); }}
                        className={`px-4 py-3 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                          userPlantId === p.id
                            ? 'bg-[#a6f2d1]/30 text-[#1b6b51] font-semibold'
                            : 'hover:bg-zinc-50 text-black'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            : <IoLeaf className="text-emerald-400 text-xs" />
                          }
                        </div>
                        <span className="truncate">{p.nickname || 'My Plant'}</span>
                        {p.currentStage && (
                          <span className="ml-auto text-[10px] text-zinc-400 flex-shrink-0">{p.currentStage}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#47464a] uppercase tracking-widest mb-2">Special Care Notes</label>
            <textarea
              className="w-full bg-[#f4f2fd] border-none rounded-xl p-4 text-sm placeholder:text-[#78767b] focus:outline-none focus:ring-4 focus:ring-[#1b6b51]/10 resize-none transition-all"
              rows={3}
              placeholder="Add specific botanical instructions or observation notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#c8c5ca]/30 flex gap-3">
          <button
            onClick={close}
            className="flex-1 h-12 border border-[#c8c5ca] rounded-xl text-sm text-[#1a1b22] font-medium hover:bg-[#e8e7f1] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 bg-[#1b6b51] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
           
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Save Task</span><MdCalendarMonth className="text-lg" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}