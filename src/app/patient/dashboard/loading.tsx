export default function PatientDashboardLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <p className="sr-only" role="status">Loading dashboard...</p>
      <div className="mb-6" aria-hidden="true">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
