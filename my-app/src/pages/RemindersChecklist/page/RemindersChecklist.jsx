import  { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../Auth/Service/AuthContext';
import { FullPageLoader, SectionHeader,MobileSectionNav,Topbar, Footer } from '../../../components/index';

import {

  MdAddCircleOutline,

} from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

import {
  loadChecklistData,

  setReminderCompleted,
  deleteReminder,

} from '../services/ReminderService';
import {TODAY} from '../utils/date'

import {AddReminderModal,TaskRow,Toast} from '../components/index'

export default function RemindersChecklist() {
  const { currentUser } = useAuth();
  const userId          = currentUser?.uid ?? null;

  const [tasks,      setTasks]      = useState([]);
  const [userPlants, setUserPlants] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  const [toast,       setToast]       = useState({ message: '', visible: false });
  const toastTimerRef                 = useRef(null);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message: msg, visible: true });
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }, []);

  const loadData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { tasks: t, userPlants: up } = await loadChecklistData(userId);
      setTasks(t);
      setUserPlants(up);
    } catch (err) {
      console.error('Load checklist error:', err);
      showToast('Failed to load reminders.');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ✅ Listen for the custom event fired by Topbar after saving
  useEffect(() => {
    const handleReminderCreated = () => {
      loadData();
      showToast('New reminder added!');
    };
    window.addEventListener('reminder:created', handleReminderCreated);
    return () => window.removeEventListener('reminder:created', handleReminderCreated);
  }, [loadData, showToast]);

  const handleToggle = useCallback(async (reminderId, newCompleted) => {
    setTasks((prev) => prev.map((t) => t.id === reminderId ? { ...t, completed: newCompleted } : t));
    try {
      await setReminderCompleted(reminderId, newCompleted);
      showToast(newCompleted ? 'Task complete!' : 'Task reopened.');
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => t.id === reminderId ? { ...t, completed: !newCompleted } : t));
      showToast('Failed to update task.');
    }
  }, [showToast]);

  const handleDelete = useCallback(async (reminderId) => {
    setTasks((prev) => prev.filter((t) => t.id !== reminderId));
    try {
      await deleteReminder(reminderId);
      showToast('Reminder deleted.');
    } catch (err) {
      console.error(err);
      await loadData();
      showToast('Failed to delete reminder.');
    }
  }, [showToast, loadData]);

  const handleModalSaved = useCallback(async (msg) => {
    setShowModal(false);
    await loadData();
    showToast(msg);
  }, [loadData, showToast]);

  const remainingCount = tasks.filter((t) => !t.completed).length;

  if (loading) return <FullPageLoader message="Loading today's tasks" />;

  return (
    <div className="bg-[#fbf8ff] pb-28 md:pb-8 text-neutral-900 min-h-screen flex flex-col">
  <div className="hidden md:block">
  <SectionHeader />
</div>

<div className="md:hidden">
  <Topbar />
  <MobileSectionNav />
</div>

      <main className="flex-grow w-full max-w-lg mx-auto px-4 md:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#1b6b51] mb-0.5">{TODAY}</p>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Today's Tasks</h1>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity duration-300 ${remainingCount === 0 ? 'opacity-0' : 'opacity-100'}`} style={{ background: '#e6f9f1', color: '#0f6e56' }}>
            {remainingCount} remaining
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-28 h-28 mb-5 rounded-full bg-[#eeedf7] flex items-center justify-center overflow-hidden">
              <img alt="Thriving Garden" className="w-full h-full object-cover opacity-60 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9zaVUIPk_0pTuuyl5NinKdeMnFOHgVhTftwAnCoA0b0SCfEiIU1jK5_tlF-AgYyeGd6804R_YlmPigDm9pgGhqbp_rXue3WRGRttAvtSs1qCnWrOxWiAspE_LaXNDODl8MolANF-rHYaUtWtxk9nlXKF7DLQGCIHXcwLhqcAUORm3_VuNGOp2HxHyPw9GvthCwiiOJb6v73HVtb-JlipS21Thn2HZ8sAo_pS5AsaYyXbkusmh7spn5vJIlOrVjknjvJXsOEHCKfk" />
            </div>
            <p className="text-base font-bold text-[#1b6b51] mb-1">All caught up!</p>
            <p className="text-sm text-neutral-500">Your garden is thriving today.</p>
            <button onClick={() => setShowModal(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#1b6b51] text-white text-xs font-bold rounded-xl hover:bg-[#164f3c] active:scale-95 transition-all">
              <MdAddCircleOutline className="text-sm" />
              Add a reminder
            </button>
          </div>
        ) : (
          <div>
            {tasks.map((task, index) => (
              <TaskRow key={task.id} task={task} isLast={index === tasks.length - 1} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

     <Footer/>

      {showModal && (
        <AddReminderModal userId={userId} userPlants={userPlants} onClose={() => setShowModal(false)} onSaved={handleModalSaved} />
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}