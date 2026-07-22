import { IoLeaf } from "react-icons/io5";

export default function PlantPlaceholder({ size = 'md' }) {
  const dim = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <div className={`${dim} rounded-md bg-[#FBF3DF] border border-dashed border-[#3F6B4A]/40 flex items-center justify-center flex-shrink-0`}>
      <IoLeaf className={`${iconSize} text-[#3F6B4A]`} />
    </div>
  );
}