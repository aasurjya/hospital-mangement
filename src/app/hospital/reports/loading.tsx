export default function ReportsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <p className="sr-only" role="status">Loading reports...</p>
      <div className="mb-6" aria-hidden="true">
        <div className="h-8 w-32 animate-pulse rounded bg-neutral-200" />
      </div>
      {/* Tab bar skeleton */}
      <div className="mb-4 flex gap-2" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-28 animate-pulse rounded-full bg-neutral-200" />
        ))}
      </div>
      {/* Stat cards skeleton */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white" aria-hidden="true">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {Array.from({ length: 5 }).map((_, row) => (
              <tr key={row}>
                {Array.from({ length: 5 }).map((_, col) => (
                  <td key={col} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
