import { IoLeaf } from "react-icons/io5";

export default function PlantPlaceholder({ size = 'md' }) {
  const dim = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <div className={`${dim} rounded-md bg-[#e8f8f1] border border-dashed border-[#1b6b51]/40 flex items-center justify-center flex-shrink-0`}>
      <IoLeaf className={`${iconSize} text-[#1b6b51]`} />
    </div>
  );
}