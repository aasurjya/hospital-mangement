export default function StaffLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-36 animate-pulse rounded-md bg-neutral-200" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {Array.from({ length: 5 }).map((_, row) => (
              <tr key={row}>
                {Array.from({ length: 6 }).map((_, col) => (
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
