
import {

  MdCheckCircle,
  
  MdErrorOutline,

} from 'react-icons/md';


export default function Toast({ toast }) {
  return (
    <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
    }`}>
      <div className="bg-zinc-950 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[260px]">
        {toast.type === 'error'
          ? <MdErrorOutline className="text-red-400 text-lg flex-shrink-0" />
          : <MdCheckCircle  className="text-emerald-400 text-lg flex-shrink-0" />
        }
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}