import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Auth/Service/AuthContext';
import { FullPageLoader, Topbar } from '../../../components/index';

import {
  loadTaskManagerPage,
  createTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  computeTaskStats,
} from '../services/TaskManagerService';

// React Icons
import {
  MdCalendarMonth,MdAdd,MdErrorOutline,MdNotificationsActive,} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import { MobileNav, TaskHeader,ActivePrescriptions,StatBar,TaskItem,TaskModal,Toast } from '../components/index';


export default function PlantAidTaskManager() {
  const navigate        = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const userId = currentUser?.uid ?? null;

  // ── Data state ───────────────────────────────────────────
  const [tasks,      setTasks]      = useState([]);
  const [userPlants, setUserPlants] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dataError,  setDataError]  = useState(null);

  // ── UI state ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('all'); // all | pending | completed

  // ── Toast ────────────────────────────────────────────────
  const [toast,    setToast]    = useState({ visible: false, message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3000,
    );
  }, []);

  // ── Load on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      setDataError(null);
      try {
        const data = await loadTaskManagerPage(userId);
        setTasks(data.tasks);
        setUserPlants(data.userPlants);
      } catch (err) {
        console.error('Task manager load error:', err);
        setDataError('Failed to load tasks. Please check your connection.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // ── Create task ───────────────────────────────────────────
  const handleSave = useCallback(async (formData) => {
    if (!userId) return;
    setSaving(true);
    try {
      const newTask = await createTask(userId, formData);
      setTasks((prev) => [...prev, newTask].sort((a, b) => {
        const da = a.reminderDate?.toDate ? a.reminderDate.toDate() : new Date(a.reminderDate);
        const db_ = b.reminderDate?.toDate ? b.reminderDate.toDate() : new Date(b.reminderDate);
        return da - db_;
      }));
      setModalOpen(false);
      showToast('Task scheduled!');
    } catch (err) {
      console.error('Create task error:', err);
      showToast('Failed to save task.', 'error');
    } finally {
      setSaving(false);
    }
  }, [userId, showToast]);

  // ── Toggle complete ───────────────────────────────────────
  const handleToggle = useCallback(async (task) => {
    const wasCompleted = task.completed;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: !wasCompleted } : t));
    try {
      if (wasCompleted) await uncompleteTask(task.id);
      else               await completeTask(task.id);
    } catch (err) {
      console.error('Toggle task error:', err);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: wasCompleted } : t));
      showToast('Could not update task.', 'error');
    }
  }, [showToast]);

  // ── Delete task ───────────────────────────────────────────
  const handleDelete = useCallback(async (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await deleteTask(task.id);
      showToast('Task removed.');
    } catch (err) {
      console.error('Delete task error:', err);
      setTasks((prev) => [task, ...prev]);
      showToast('Could not delete task.', 'error');
    }
  }, [showToast]);

  const stats = computeTaskStats(tasks);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending')   return !t.completed;
    if (filter === 'completed') return  t.completed;
    return true;
  });

  const displayName = userProfile?.name || currentUser?.displayName || 'User';
  const photoURL    = userProfile?.photoURL || currentUser?.photoURL || null;
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const user = { displayName, photoURL, initials }; // ← add this

  // ── Full-page loader ──────────────────────────────────────
  if (loading) {
    return <FullPageLoader message="Loading your task manager" />;
  }

  return (
    <div
      className="bg-[#fbf8ff] text-[#1a1b22] min-h-screen flex flex-col font-sans relative overflow-x-hidden"
     
    >
      {/* Desktop topbar — hidden on small screens */}
<div className="hidden md:block">
  <TaskHeader 
  navigate={navigate} 
  setModalOpen={setModalOpen} 
  photoURL={null} // Pass null or omit it entirely
  displayName={user?.displayName || 'User'} 
  initials={user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'PA'} 
/>
</div>

{/* Mobile topbar — visible only on small screens */}
<div className="block md:hidden">
  <Topbar/>
  <MobileNav
    navigate={navigate}
    setModalOpen={setModalOpen}
    photoURL={user.photoURL}
    displayName={user.displayName}
    initials={user.initials}
  />
</div>
      {/* ── END TOPBAR ─────────────────────────────────────── */}

      {/* Main */}
      <main
        className={`max-w-7xl mx-auto lg:mt-14 md:mt-14 mt-0 px-4 md:px-6 py-8 pb-6 md:pb-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300 ${
          modalOpen ? 'blur-sm opacity-40 pointer-events-none select-none' : ''
        }`}
        aria-hidden={modalOpen}
      >
        {/* Left — main content */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Page header */}
          <div>
            <div className="flex items-center gap-2 text-[#1b6b51] mb-1">
              <MdCalendarMonth className="text-base" />
              <span className="text-xs font-bold uppercase tracking-widest">Botanical Ward</span>
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
              Your Care Tasks
            </h1>
            <p className="text-sm text-[#47464a] mt-1">Select a plant to manage treatment cycles and scheduled care.</p>
          </div>

          {/* Error banner */}
          {dataError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3">
              <MdErrorOutline className="flex-shrink-0" /> {dataError}
            </div>
          )}

          {/* Stats */}
          <StatBar stats={stats} />

          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            {[
              { key: 'all',       label: 'All Tasks'  },
              { key: 'pending',   label: 'Pending'    },
              { key: 'completed', label: 'Completed'  },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === f.key
                    ? 'bg-black text-white'
                    : 'bg-white text-[#47464a] border border-[#c8c5ca]/60 hover:border-[#1b6b51]/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="flex flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-white dark:bg-zinc-900 rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50">
                <div className="w-14 h-14 rounded-2xl bg-[#a6f2d1]/30 flex items-center justify-center">
                  <MdNotificationsActive className="text-2xl text-[#1b6b51]" />
                </div>
                <div>
                  <p className="text-base font-bold text-[#1a1b22]">No tasks here</p>
                  <p className="text-sm text-[#47464a] mt-1">
                    {filter === 'completed' ? 'No completed tasks yet.' : 'Schedule your first care task.'}
                  </p>
                </div>
                {filter !== 'completed' && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="mt-1 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
                  >
                    <MdAdd className="text-base" />
                    Schedule Task
                  </button>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  userPlants={userPlants}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <aside>
          <ActivePrescriptions tasks={tasks} userPlants={userPlants} />
        </aside>
      </main>

      {/* Footer */}
     <footer className="bg-[#fbf8ff] border-t border-[#c8c5ca]/60 py-6 px-4 flex flex-col items-center gap-2 mt-auto pb-20 md:pb-6">
        <div className="flex items-center gap-1.5">
          <IoLeaf className="text-[#1b6b51]" />
          <span className="text-base font-bold text-black dark:text-white">PlantAid</span>
        </div>
        <div className="flex gap-5">
          <a className="text-xs text-[#47464a] hover:text-[#1b6b51] transition-colors" href="#">Sign up</a>
          <a className="text-xs text-[#47464a] hover:text-[#1b6b51] transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs text-[#47464a] hover:text-[#1b6b51] transition-colors" href="#">Help Center</a>
        </div>
        <p className="text-xs text-[#1b6b51]">© {new Date().getFullYear()} PlantAid. Botanical Precision.</p>
      </footer>

    

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          userPlants={userPlants}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}