import { useNavigate } from 'react-router-dom';
import { IoLeaf } from 'react-icons/io5';
import { MdArrowBack, MdSearchOff } from 'react-icons/md';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#fbf8ff] min-h-screen flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">

      {/* Minimal nav */}
      <header className="w-full h-16 bg-white border-b border-zinc-200/80 flex items-center px-4 md:px-6">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <IoLeaf className="text-emerald-600 text-xl" />
          <span className="text-xl font-extrabold text-zinc-900 tracking-tight">PlantAid</span>
        </div>
      </header>

      {/* Body */}
      <main className="flex-grow flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-sm">

          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <MdSearchOff className="text-4xl text-emerald-300" />
          </div>

          {/* Eyebrow */}
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            404 — Page Not Found
          </span>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight mt-5 mb-2">
            Lost in the garden.
          </h1>

          {/* Subtext */}
          <p className="text-sm font-medium text-zinc-400 leading-relaxed">
            The page you're looking for doesn't exist or was moved. Head back to your dashboard to get back on track.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 border border-zinc-200 bg-white text-zinc-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all"
            >
              <MdArrowBack className="text-base" />
              Go Back
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            >
              <IoLeaf className="text-base" />
              Dashboard
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/80 flex flex-col items-center gap-2 w-full px-6 py-6">
        <div className="flex items-center gap-1.5 mb-1">
          <IoLeaf className="text-emerald-600 text-lg" />
          <span className="text-sm font-extrabold text-zinc-900">PlantAid</span>
        </div>
        <div className="flex gap-6">
          <a className="text-zinc-400 hover:text-emerald-700 transition-colors text-xs font-medium" href="#">Privacy Policy</a>
          <a className="text-zinc-400 hover:text-emerald-700 transition-colors text-xs font-medium" href="#">Help Center</a>
        </div>
        <p className="text-xs text-zinc-400/60 font-medium mt-1">
          © {new Date().getFullYear()} PlantAid. Botanical Precision.
        </p>
      </footer>
    </div>
  );
}