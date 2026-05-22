export default function HistoryLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12" aria-busy="true" aria-label="Loading history">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3.5 w-28 animate-pulse rounded-full bg-forest-700/8" />
          <div className="h-9 w-32 animate-pulse rounded-full bg-forest-700/8" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-card border border-forest-700/8 bg-cream-50 px-5 py-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 animate-pulse rounded-full bg-forest-700/8" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-forest-700/8" />
                <div className="h-3 w-20 animate-pulse rounded-full bg-forest-700/5" />
              </div>
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-forest-700/8" />
          </div>
        ))}
      </div>
    </main>
  );
}
