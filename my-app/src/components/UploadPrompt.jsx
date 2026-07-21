import { useState, } from 'react';

import {
  MdPhotoCamera,
  MdUploadFile,
} from 'react-icons/md';



export default function UploadPrompt({ onFile, onTakePhoto, onChooseFiles }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(e)  => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={()  => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        onFile(files.length > 1 ? files : files[0]);
      }}
      className={`w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${
        isDragging
          ? 'border-[#1b6b51] bg-[#a6f2d1]/20'
          : 'border-[#c8c5ca] bg-white dark:bg-zinc-900'
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#a6f2d1]/30 flex items-center justify-center">
        <MdPhotoCamera className="text-3xl text-[#1b6b51]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-black dark:text-white">Take or upload a photo</p>
        <p className="text-xs text-[#47464a] mt-0.5">Or drag an image here</p>
      </div>

      {/* NEW: explicit actions so the mode modal knows which flow to open */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTakePhoto}
          className="flex items-center gap-1.5 bg-black text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-zinc-900 active:scale-95 transition-all"
        >
          <MdPhotoCamera className="text-sm" /> Take Photo
        </button>
        <button
          onClick={onChooseFiles}
          className="flex items-center gap-1.5 border border-[#1b6b51]/50 text-[#1b6b51] text-xs font-bold px-4 py-2 rounded-full hover:bg-[#1b6b51]/10 active:scale-95 transition-all"
        >
          <MdUploadFile className="text-sm" /> Choose Files
        </button>
      </div>
    </div>
  );
}