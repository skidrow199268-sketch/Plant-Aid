export default function Footer({ onOpen }) {
  return (
   <footer className="w-full bg-[#fbf8ff] border-t mb-15  border-[#c8c5ca] mt-auto px-4 sm:px-6 py-6 lg:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between items-center text-center gap-4 md:gap-8">
        <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-8">
          <button
            onClick={() => onOpen("profile")}
            className="text-sm text-[#47464a] hover:text-[#237157] transition-colors"
          >
            Sign up
          </button>

          <button
            onClick={() => onOpen("terms")}
            className="text-sm text-[#47464a] hover:text-[#237157] transition-colors"
          >
            Privacy Policy
          </button>

          <button
            onClick={() => onOpen("help")}
            className="text-sm text-[#47464a] hover:text-[#237157] transition-colors"
          >
            Help Center
          </button>
        </div>

        <h2 className="text-lg font-bold tracking-tight text-black">
          PlantAid
        </h2>

        <p className="text-sm text-[#1b6b51]">
          © {new Date().getFullYear()} PlantAid. Botanical Precision.
        </p>
      </div>
    </footer>
  );
}