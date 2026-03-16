export const metadata = { title: 'Unauthorized | Hospital Platform' }

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">Access Denied</h1>
        <p className="mt-2 text-neutral-500">
          You do not have permission to view this page.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Go to dashboard
        </a>
      </div>
    </main>
  )
}
