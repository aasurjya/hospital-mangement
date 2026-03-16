export default function ProfileLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <p className="sr-only" role="status">Loading profile...</p>
      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200 mb-6" aria-hidden="true" />
      <div className="h-48 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 mb-6" aria-hidden="true" />
      <div className="h-64 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100" aria-hidden="true" />
    </div>
  )
}
