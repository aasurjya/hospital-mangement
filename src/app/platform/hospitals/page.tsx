/**
 * Platform admin: hospitals list page.
 */
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Hospitals | Platform Admin' }

export default async function HospitalsPage() {
  await requirePlatformAdmin()

  const supabase = await createSupabaseServerClient()
  const { data: hospitals, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('name')

  if (error) {
    return (
      <div className="p-6 text-error-600">
        Failed to load hospitals. Please try again.
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Hospitals</h1>
        <a
          href="/platform/hospitals/new"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Add hospital
        </a>
      </div>

      {hospitals.length === 0 ? (
        <p className="text-neutral-500">No hospitals yet. Add the first one.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    <a href={`/platform/hospitals/${h.id}`} className="hover:text-primary-600">
                      {h.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{h.slug}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      h.is_active
                        ? 'bg-success-100 text-success-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {h.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(h.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
