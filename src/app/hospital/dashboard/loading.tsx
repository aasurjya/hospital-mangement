export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-200" />
          <div className="h-3 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="h-8 w-12 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 w-32 animate-pulse rounded-md bg-neutral-200" />
          ))}
        </div>
      </div>

      {/* Two side-by-side table panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, panel) => (
          <div key={panel} className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-12 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 4 }).map((_, row) => (
                <div key={row} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-4 flex-1 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
