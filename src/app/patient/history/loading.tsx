export default function HistoryLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <p className="sr-only" role="status">Loading history...</p>
      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200 mb-6" aria-hidden="true" />
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
