export default function Footer({ onOpen }) {
  return (
    <footer className="w-full py-6 bg-[#fbf8ff] border-t mb-20 border-[#c8c5ca] flex flex-col items-center gap-2 px-6 mt-auto">
      <div className="flex items-center gap-5 sm:gap-12 mb-2 flex-wrap justify-center">
        <button onClick={() => onOpen('profile')} className="text-[#47464a] hover:text-[#237157] transition-colors text-sm">Sign up</button>
        <button onClick={() => onOpen('terms')}   className="text-[#47464a] hover:text-[#237157] transition-colors text-sm">Privacy Policy</button>
        <button onClick={() => onOpen('help')}    className="text-[#47464a] hover:text-[#237157] transition-colors text-sm">Help Center</button>
      </div>
      <div className="text-black text-lg font-bold tracking-tight">PlantAid</div>
      <div className="text-[#1b6b51] text-sm">© {new Date().getFullYear()} PlantAid. Botanical Precision.</div>
    </footer>
  );
}