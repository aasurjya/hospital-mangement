export default function InvoiceDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
        <div className="mt-3 h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-200" />
        ))}
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-5 w-full animate-pulse rounded bg-neutral-200" />
        ))}
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
