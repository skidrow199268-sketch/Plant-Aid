import { useState} from 'react';

import {
  MdEditNote,
  MdAdd,
  MdDelete,
} from 'react-icons/md';

import {
  addJournalEntry,
  deleteJournalEntry,
  formatDate,
} from '../services/PlantDetailService';

export default function JournalLogsView({ journals=[], userId, userPlantId, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', content: '' });
  const [saving, setSaving]     = useState(false);

  const handleAdd = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      await addJournalEntry(userId, userPlantId, form);
      setForm({ title: '', content: '' });
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
          <h3 className="text-xl font-serif font-semibold text-[#212B22] tracking-tight">Growth Diary</h3>
          <p className="text-xs text-[#6E7568] font-mono mt-0.5">
            {String(journals?.length ?? 0).padStart(2, '0')} ENTR{journals?.length !== 1 ? 'IES' : 'Y'}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 bg-[#212B22] text-[#F5F6F0] px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] transition-colors"
        >
          <MdAdd className="text-sm" /> New Entry
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F5F6F0] border border-[#E4E1D3] rounded-md p-5 space-y-3">
          <p className="text-xs font-bold text-[#6E7568] uppercase tracking-widest font-mono">New Journal Entry</p>
          <input
            className="w-full bg-white border border-[#E4E1D3] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#3F6B4A] transition text-[#212B22]"
            placeholder="Entry title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="w-full bg-white border border-[#E4E1D3] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#3F6B4A] resize-none transition text-[#212B22]"
            rows={4}
            placeholder="What did you observe today?"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-sm border border-[#E4E1D3] text-xs font-bold uppercase tracking-widest text-[#6E7568] hover:bg-white transition-colors">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 py-2.5 rounded-sm bg-[#212B22] text-[#F5F6F0] text-xs font-bold uppercase tracking-widest hover:bg-[#3F6B4A] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {journals.length === 0 && !showForm ? (
        <div className="bg-white border border-[#E4E1D3] rounded-md p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-md bg-[#F5F6F0] flex items-center justify-center">
            <MdEditNote className="text-[#6E7568] text-2xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#212B22]">No Journal Entries</p>
            <p className="text-xs text-[#6E7568] mt-1">Start documenting your plant's journey.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {journals.map((j) => (
            <div key={j.id}
              className="bg-white border border-[#E4E1D3] rounded-md px-5 py-4 flex items-start gap-4 hover:border-[#3F6B4A] transition-colors duration-150">
              <div className="w-10 h-10 bg-[#F5F6F0] border border-[#E4E1D3] rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <MdEditNote className="text-[#6E7568] text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#212B22] truncate">{j.title}</p>
                <p className="text-xs text-[#6E7568] mt-1 line-clamp-2 leading-relaxed">{j.content}</p>
                <p className="text-[11px] text-[#6E7568]/70 mt-2 font-mono">{formatDate(j.createdAt)}</p>
              </div>
              <button onClick={() => deleteJournalEntry(j.id).then(onRefresh)}
                className="w-8 h-8 rounded-sm hover:bg-[#A14B36]/10 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
                title="Delete entry">
                <MdDelete className="text-lg text-[#A14B36]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}