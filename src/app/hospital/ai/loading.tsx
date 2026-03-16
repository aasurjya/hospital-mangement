export default function AiAssistantLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <p className="sr-only" role="status">Loading AI Assistant...</p>
      <div className="h-8 w-56 animate-pulse rounded bg-neutral-200 mb-6" aria-hidden="true" />
      <div className="h-16 animate-pulse rounded-lg border border-warning-200 bg-warning-50 mb-6" aria-hidden="true" />
      <div className="mb-6 flex gap-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-32 animate-pulse rounded-full bg-neutral-200" />
        ))}
      </div>
      <div className="space-y-4" aria-hidden="true">
        <div className="h-10 w-full animate-pulse rounded-md bg-neutral-200" />
        <div className="h-32 w-full animate-pulse rounded-md bg-neutral-200" />
        <div className="h-10 w-40 animate-pulse rounded-md bg-neutral-200" />
      </div>
    </div>
  )
}
