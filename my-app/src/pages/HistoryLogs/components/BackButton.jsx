import { MdArrowBack } from "react-icons/md";



export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 bg-white border border-[#c8c5ca] text-[#47464a] px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wide hover:border-[#1b6b51]/40 hover:text-[#1b6b51] hover:bg-[#f4f2fd] transition-all duration-200 active:scale-95 shadow-sm mb-5"
    >
      <MdArrowBack className="text-sm transition-transform duration-200 group-hover:-translate-x-0.5" />
      Back to Scanner
    </button>
  );
}