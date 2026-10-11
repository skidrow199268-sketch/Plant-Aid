
import {
 MdClose,
MdNotificationsNone,
} from 'react-icons/md';



export default function NotificationsPopup({ onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-zinc-900 rounded-2xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#c8c5ca]/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#a6f2d1] flex items-center justify-center">
              <MdNotificationsNone className="text-[#1b6b51] text-sm" />
            </div>
            <span className="text-sm font-bold text-black dark:text-white">
              Notifications
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e8e7f1] transition-colors"
          >
            <MdClose className="text-[#47464a] text-base" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#a6f2d1]/30 flex items-center justify-center">
            <MdNotificationsNone className="text-2xl text-[#1b6b51]" />
          </div>
          <p className="text-sm font-bold text-black dark:text-white">
            No notifications yet
          </p>
          <p className="text-xs text-[#47464a] max-w-[220px] leading-relaxed">
            Plant care reminders and alerts will appear here once you set them up.
          </p>
        </div>
      </div>
    </>
  );
}