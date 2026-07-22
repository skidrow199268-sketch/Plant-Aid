import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MdCheckCircle,
  MdNotificationsActive,
  MdAdd,
  MdDelete,
} from 'react-icons/md';

import {addReminder, completeReminder, deleteReminder, formatDate, formatTime, reminderTypeMeta, } from '../services/PlantDetailService';

export default function CareRemindersView({ reminders, userId, userPlantId, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', type: 'WATER', reminderDate: '' });
  const [saving, setSaving]     = useState(false);

  const handleAdd = async () => {
    if (!form.title || !form.reminderDate) return;
    setSaving(true);
    try {
      await addReminder(userId, userPlantId, form);
      setForm({ title: '', type: 'WATER', reminderDate: '' });
      setShowForm(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif font-semibold text-[#212B22] tracking-tight">Upcoming Tasks</h3>
          <p className="text-xs text-[#6E7568] font-mono mt-0.5">
            {String(reminders.length).padStart(2, '0')} PENDING REMINDER{reminders.length !== 1 ? 'S' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[#212B22] text-[#F5F6F0] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] transition-colors"
        >
          <MdAdd className="text-sm" /> Add Reminder
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F5F6F0] border border-[#E4E1D3] rounded-md p-5 space-y-3">
          <p className="text-xs font-bold text-[#6E7568] uppercase tracking-widest font-mono">New Reminder</p>
          <input
            className="w-full bg-white border border-[#E4E1D3] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#3F6B4A] transition text-[#212B22]"
            placeholder="e.g. Water Monstera"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="w-full bg-white border border-[#E4E1D3] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#3F6B4A] transition text-[#212B22]"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="WATER">Water</option>
              <option value="FERTILIZE">Fertilize</option>
              <option value="REPOT">Repot</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <input
              type="datetime-local"
              className="w-full bg-white border border-[#E4E1D3] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#3F6B4A] transition text-[#212B22]"
              value={form.reminderDate}
              onChange={(e) => setForm((f) => ({ ...f, reminderDate: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-sm border border-[#E4E1D3] text-xs font-bold uppercase tracking-widest text-[#6E7568] hover:bg-white transition-colors">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 py-2.5 rounded-sm bg-[#212B22] text-[#F5F6F0] text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Save Reminder'}
            </button>
          </div>
        </div>
      )}

      {reminders.length === 0 && !showForm ? (
        <div className="bg-white border border-[#E4E1D3] rounded-md p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-md bg-[#FBF3DF] flex items-center justify-center">
            <MdNotificationsActive className="text-[#A9812F] text-2xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#212B22]">No Pending Tasks</p>
            <p className="text-xs text-[#6E7568] mt-1">Add a reminder to stay on top of care.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => {
            const { label, colorClass } = reminderTypeMeta(r.type);
            return (
              <div key={r.id}
                className="bg-white border border-[#E4E1D3] rounded-md px-5 py-4 flex items-center gap-4 hover:border-[#3F6B4A] transition-colors duration-150">
                <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border flex-shrink-0 ${colorClass}`}>
                  {label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#212B22] truncate">{r.title}</p>
                  <p className="text-[11px] text-[#6E7568] font-mono mt-0.5">
                    {formatDate(r.reminderDate)} · {formatTime(r.reminderDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => completeReminder(r.id).then(onRefresh)}
                    className="w-8 h-8 rounded-sm hover:bg-[#3F6B4A]/10 flex items-center justify-center transition-colors"
                    title="Mark complete">
                    <MdCheckCircle className="text-lg text-[#3F6B4A]" />
                  </button>
                  <button onClick={() => deleteReminder(r.id).then(onRefresh)}
                    className="w-8 h-8 rounded-sm hover:bg-[#A14B36]/10 flex items-center justify-center transition-colors"
                    title="Delete">
                    <MdDelete className="text-lg text-[#A14B36]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}