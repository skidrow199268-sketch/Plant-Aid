export default function AnalysisSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#1a1a1a] rounded-3xl border border-[#c8c5ca]/40 dark:border-zinc-700/50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-zinc-900/20 space-y-5 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-zinc-100" />
        <div className="h-5 w-48 bg-zinc-100 rounded-full" />
        <div className="ml-auto h-6 w-20 bg-zinc-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-zinc-100 rounded-full" />
        <div className="h-3 w-5/6 bg-zinc-100 rounded-full" />
        <div className="h-3 w-4/6 bg-zinc-100 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-50 rounded-2xl border border-zinc-100" />
        ))}
      </div>
      <div className="h-16 bg-zinc-50 rounded-2xl border border-zinc-100" />
    </div>
  );
}
