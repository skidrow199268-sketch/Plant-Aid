import{ useState,useRef,  } from 'react';



// React Icons
import {MdClose,MdAddPhotoAlternate,} from 'react-icons/md';




export default function ImageDropzone({ preview, onFile, onClear }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  if (preview) {
    return (
      <div className="relative rounded-3xl overflow-hidden border border-[#c8c5ca]/50 group">
        <img src={preview} alt="Preview" className="w-full max-h-64 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white hover:bg-black/80 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <MdClose className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-3 right-3 px-4 py-2 bg-black/60 rounded-xl text-white text-xs font-semibold hover:bg-black/80 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1.5"
        >
          <MdAddPhotoAlternate className="text-sm" />
          Change photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-2xl py-8 flex flex-col items-center gap-2 transition-all ${
        isDragging
          ? 'border-[#1b6b51] bg-[#a6f2d1]/20'
          : 'border-zinc-200 hover:border-[#1b6b51] bg-zinc-50 hover:bg-[#a6f2d1]/10 text-zinc-400 hover:text-[#1b6b51]'
      }`}
    >
      <MdAddPhotoAlternate className="text-3xl" />
      <span className="text-sm font-medium">Drag plant photo here or click to browse</span>
      <span className="text-xs text-zinc-300">JPG, PNG, WEBP</span>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}
