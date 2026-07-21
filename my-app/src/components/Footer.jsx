import { useState } from "react";
import { IoLeaf } from "react-icons/io5";

export default function Footer() {
  const [modalType, setModalType] = useState(null);

  return (
    <>
      <footer className="bg-white dark:bg-[#1a1a1a] w-full px-8 py-6 mt-auto border-t border-zinc-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between items-center gap-4 sm:gap-3">
        <div className="flex items-center gap-2">
          <IoLeaf className="text-emerald-700 text-[18px]" />
          <span className="text-[15px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            PlantAid
          </span>
        </div>

        <div className="flex items-center gap-5 flex-wrap justify-center">
          
            <a href="/auth/register"
            className="text-xs text-zinc-400 hover:text-emerald-700 transition-colors duration-150"
          >
            Sign up
          </a>
          <span className="text-zinc-300 text-xs">·</span>
          <button
            type="button"
            onClick={() => setModalType("privacy")}
            className="text-xs text-zinc-400 hover:text-emerald-700 transition-colors duration-150 cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-zinc-300 text-xs">·</span>
          <button
            type="button"
            onClick={() => setModalType("help")}
            className="text-xs text-zinc-400 hover:text-emerald-700 transition-colors duration-150 cursor-pointer"
          >
            Help Center
          </button>
        </div>

        <p className="text-[11px] text-zinc-400/50 sm:text-right">
          © {new Date().getFullYear()} PlantAid. Botanical Precision.
        </p>
      </footer>

      {/* Modal Popup */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-zinc-100 rounded-xl p-8 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold">
              {modalType === "privacy" ? "Privacy Policy" : "Help Center"}
            </h3>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {modalType === "privacy" ? (
                <p>
                  PlantAid collects minimal data necessary to provide precision botanical monitoring. We do not sell or share your personal information.
                </p>
              ) : (
                <p>
                  Need assistance? You can reach out to our support team at support@plantaid.com or browse our online documentation.
                </p>
              )}
            </div>
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}