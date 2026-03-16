export default function FeedbackLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <p className="sr-only" role="status">Loading feedback...</p>
      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200 mb-6" aria-hidden="true" />
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
