export default function BoardsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-slate-800/50"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
