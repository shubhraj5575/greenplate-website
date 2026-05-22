export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12" aria-busy="true" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <div className="h-3.5 w-28 animate-pulse rounded-full bg-forest-700/8" />
          <div className="h-9 w-64 animate-pulse rounded-full bg-forest-700/8" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-full bg-forest-700/8" />
      </div>

      {/* Grid skeleton — mirrors DashboardSummary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-44 animate-pulse rounded-card bg-forest-700/5" />
        <div className="h-44 animate-pulse rounded-card bg-forest-700/5" />
        <div className="h-36 animate-pulse rounded-card bg-forest-700/5" />
        <div className="h-36 animate-pulse rounded-card bg-forest-700/5" />
        <div className="lg:col-span-2 h-36 animate-pulse rounded-card bg-forest-700/5" />
        <div className="lg:col-span-3 h-[220px] animate-pulse rounded-card bg-forest-700/5" />
      </div>
    </main>
  );
}
