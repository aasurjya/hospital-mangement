import { notFound } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'

export const metadata = { title: 'Hospital Detail | Platform Admin' }

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformAdmin()
  const { id } = await params

  const supabase = await createSupabaseServerClient()

  const [
    { data: hospital },
    { data: admins, count: adminCount },
    { data: staff, count: staffCount },
  ] = await Promise.all([
    supabase.from('hospitals').select('*').eq('id', id).single(),
    supabase
      .from('user_profiles')
      .select('id, full_name, is_active, created_at', { count: 'exact' })
      .eq('hospital_id', id)
      .eq('role', 'HOSPITAL_ADMIN')
      .order('created_at'),
    supabase
      .from('user_profiles')
      .select('id, full_name, role, is_active, created_at', { count: 'exact' })
      .eq('hospital_id', id)
      .not('role', 'in', '(HOSPITAL_ADMIN,PLATFORM_ADMIN)')
      .order('full_name')
      .limit(20),
  ])

  if (!hospital) notFound()

  return (
    <main id="main-content" className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <a href="/platform/hospitals" className="text-sm text-neutral-600 hover:text-neutral-800">
            <span aria-hidden="true">← </span>Hospitals
          </a>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">{hospital.name}</h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              hospital.is_active ? 'bg-success-100 text-success-800' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {hospital.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-neutral-600">Slug: {hospital.slug}</p>
        </div>
        <a
          href={`/platform/hospitals/${id}/edit`}
          className="inline-flex items-center min-h-[44px] rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Edit
        </a>
      </div>

      {/* Details */}
      <dl className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {([
          ['Address', hospital.address],
          ['Phone', hospital.phone],
          ['Email', hospital.email],
          ['Created', new Date(hospital.created_at).toLocaleDateString()],
        ] as const).map(([label, value]) => (
          <div key={label} className="flex px-4 py-3 text-sm">
            <dt className="w-36 font-medium text-neutral-600">{label}</dt>
            <dd className="text-neutral-900">{value || <span className="text-neutral-400">—</span>}</dd>
          </div>
        ))}
      </dl>

      {/* Hospital admins */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            Hospital admins <span className="text-sm font-normal text-neutral-600">({adminCount ?? 0})</span>
          </h2>
          <a
            href={`/platform/hospitals/${id}/admins/new`}
            className="inline-flex items-center min-h-[44px] rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Add admin
          </a>
        </div>

        {!admins || admins.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm text-neutral-600">No hospital admins yet.</p>
            <a href={`/platform/hospitals/${id}/admins/new`} className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              Add the first admin
            </a>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200" aria-label="Hospital administrators">
              <thead className="bg-neutral-50">
                <tr>
                  {['Name', 'Status', 'Added', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{admin.full_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        admin.is_active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a href={`/platform/hospitals/${id}/admins/${admin.id}/edit`}
                         className="inline-flex items-center min-h-[44px] px-2 text-primary-600 hover:text-primary-800 font-medium">Edit</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            Staff <span className="text-sm font-normal text-neutral-600">({staffCount ?? 0})</span>
          </h2>
        </div>

        {!staff || staff.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm text-neutral-600">No staff members yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200" aria-label="Hospital staff">
                <thead className="bg-neutral-50">
                  <tr>
                    {['Name', 'Role', 'Status', 'Added', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900">{s.full_name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{formatLabel(s.role)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          s.is_active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`/platform/hospitals/${id}/staff/${s.id}/edit`}
                           className="inline-flex items-center min-h-[44px] px-2 text-primary-600 hover:text-primary-800 font-medium">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(staffCount ?? 0) > 20 && (
              <p className="mt-2 text-xs text-neutral-600">Showing 20 of {staffCount}</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
