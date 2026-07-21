export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
      <span className="text-base">⚠️</span>
      {message}
    </div>
  );
}