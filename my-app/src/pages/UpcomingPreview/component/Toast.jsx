import { IoLeaf } from "react-icons/io5";



export default function Toast({ message, visible }) {
  return (
    <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="bg-zinc-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
        <IoLeaf className="text-emerald-400" />
        {message}
      </div>
    </div>
  );
}