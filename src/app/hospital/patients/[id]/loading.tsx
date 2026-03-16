export default function PatientDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
          <div className="h-8 w-56 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 animate-pulse rounded-md bg-neutral-200" />
          <div className="h-10 w-20 animate-pulse rounded-md bg-neutral-200" />
        </div>
      </div>

      {/* Demographics card */}
      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex px-4 py-3">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="ml-4 h-4 w-48 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      {/* 3 summary sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="mb-2 flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="flex gap-3">
              <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white px-4 py-2 space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-4 w-full animate-pulse rounded bg-neutral-200" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
