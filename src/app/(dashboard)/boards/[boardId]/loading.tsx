export default function BoardLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
        <div className="h-3 w-3 animate-pulse rounded-full bg-slate-700" />
        <div className="h-5 w-36 animate-pulse rounded bg-slate-800" />
        <div className="ml-auto h-7 w-32 animate-pulse rounded-full bg-slate-800" />
      </div>

      {/* Columns skeleton */}
      <div className="flex gap-4 overflow-x-auto p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-72 flex-shrink-0 rounded-xl border border-slate-700/50 bg-slate-900/60 p-3"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="mb-3 h-5 w-24 animate-pulse rounded bg-slate-800" />
            <div className="space-y-2">
              {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map((_, j) => (
                <div
                  key={j}
                  className="h-16 animate-pulse rounded-lg bg-slate-800"
                  style={{ animationDelay: `${(i * 3 + j) * 60}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
