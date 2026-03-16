export default function RecordsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <p className="sr-only" role="status">Loading records...</p>
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 mb-6" aria-hidden="true" />
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-neutral-100 px-4 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
