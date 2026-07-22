import { GrGrow } from 'react-icons/gr';
import { MdDashboard, MdNotifications, MdTask, } from 'react-icons/md';

export const NAV_ITEMS = [
  { key: 'dashboard', name: 'Dashboard', path: '/dashboard',        icon: MdDashboard },
  { key: 'reminders', name: 'Reminders', path: '/reminders',         icon: MdNotifications },
  { key: 'growth', name: 'Growth', path: '/growth',         icon: GrGrow },
   { key: 'task', name: 'Task', path: '/task-management',         icon: MdTask },
];