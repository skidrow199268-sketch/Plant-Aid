import { MdEco, MdVerifiedUser, MdLibraryAdd, MdClose, MdArrowForward } from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';
import {getStatusConfig} from '../utils/getStatusConfig'
// Dynamic badge coloring based on health status string —
// mirrors the design language used in getHealthConfig() elsewhere in the app.


export default function ScanSuccessModal({ isOpen, onClose, onSave, onViewDetails, plantData, saving, analysisLoading }) {
  if (!isOpen) return null;

  const plantInfo = {
    name: plantData?.commonName || 'Unknown Plant',
    scientificName: plantData?.scientificName || '',
    imageSrc: plantData?.imageSrc || '',
    confidence: Math.min(100, Math.max(0, plantData?.confidence || 0)),
    healthStatus: plantData?.healthStatus || 'Unknown',
    anomalies: plantData?.anomalies || 'None',
  };

  const statusCfg = getStatusConfig(plantInfo.healthStatus);

  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (plantInfo.confidence / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 antialiased"
     
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-7 border border-[#c8c5ca]/40 dark:border-zinc-700/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-10 animate-in fade-in zoom-in-95 duration-200">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <MdClose className="text-lg" />
        </button>

        {/* Plant header */}
        <section className="flex flex-col items-center text-center gap-3 mb-6 mt-2">
          <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-[#c8c5ca]/40 bg-zinc-100">
            {plantInfo.imageSrc ? (
              <img className="w-full h-full object-cover" src={plantInfo.imageSrc} alt={plantInfo.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IoLeaf className="text-3xl text-zinc-300" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-[#1b6b51] uppercase tracking-widest mb-1">Identified</p>
            <h2
              className="text-xl font-extrabold text-black dark:text-white leading-tight"
             
            >
              {plantInfo.name}
            </h2>
            {plantInfo.scientificName && (
              <p className="text-sm italic text-[#47464a] dark:text-zinc-400 mt-0.5">{plantInfo.scientificName}</p>
            )}
          </div>
        </section>

        {/* Confidence ring */}
        <section className="flex flex-col items-center justify-center mb-7">
          <div className="relative flex items-center justify-center">
            <svg className="w-44 h-44 -rotate-90">
              <defs>
                <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1b6b51" />
                  <stop offset="100%" stopColor="#2dd4a7" />
                </linearGradient>
              </defs>
              <circle
                className="text-zinc-100 dark:text-zinc-800"
                cx="88"
                cy="88"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
              />
              <circle
                cx="88"
                cy="88"
                fill="transparent"
                r={radius}
                stroke="url(#confidenceGradient)"
                strokeLinecap="round"
                strokeWidth="10"
                style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-[#1b6b51]">{plantInfo.confidence}%</span>
              <span className="text-[10px] text-[#47464a] uppercase tracking-widest font-bold mt-0.5">Confidence</span>
            </div>
          </div>
        </section>

        {/* Health metrics */}
        <section className="space-y-2.5 mb-6">
          <div className={`flex items-center p-3 rounded-2xl border border-transparent ${statusCfg.bg}`}>
            <div className={`w-9 h-9 rounded-xl ${statusCfg.iconBg} flex items-center justify-center mr-3 flex-shrink-0`}>
              <MdEco className={`text-lg ${statusCfg.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#47464a] uppercase tracking-wide">Health Status</p>
              <p className={`text-sm font-bold ${statusCfg.text} truncate`}>{plantInfo.healthStatus}</p>
            </div>
          </div>

          <div className="flex items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-transparent">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mr-3 flex-shrink-0">
              <MdVerifiedUser className="text-lg text-zinc-500 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#47464a] uppercase tracking-wide">Detected Anomalies</p>
              <p className="text-sm font-bold text-black dark:text-white truncate">{plantInfo.anomalies}</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <footer className="space-y-2.5">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="w-full border border-[#1b6b51]/30 dark:border-[#a6f2d1]/30 bg-transparent text-[#1b6b51] dark:text-[#a6f2d1] font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#a6f2d1]/15 active:scale-95 transition-all duration-200"
            >
              <span className="truncate">View more details</span>
              <MdArrowForward className="text-lg" />
            </button>
          )}

          <button
            onClick={onSave}
            disabled={analysisLoading || saving}
            className="w-full bg-black text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
           
          >
            <MdLibraryAdd className="text-lg" />
            <span className="truncate">
              {analysisLoading ? 'Analyzing plant…' : saving ? 'Saving…' : 'Save to My Garden'}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}