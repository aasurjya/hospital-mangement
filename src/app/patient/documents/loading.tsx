export default function DocumentsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <p className="sr-only" role="status">Loading documents...</p>
      <div className="h-8 w-40 animate-pulse rounded bg-neutral-200 mb-6" aria-hidden="true" />
      <div className="h-32 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 mb-6" aria-hidden="true" />
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}
