import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canManageCatalogue } from '@/lib/labs/permissions'
import { formatLabel } from '@/lib/format'
import { table as t, btn } from '@/lib/styles'
import { CatalogueForm } from './catalogue-form'

export const metadata = { title: 'Lab Test Catalogue' }

export default async function LabCataloguePage() {
  const { profile } = await requireAuth()
  const supabase = await createSupabaseServerClient()

  const { data: tests } = await supabase
    .from('lab_test_catalogue')
    .select('*')
    .eq('hospital_id', profile.hospital_id!)
    .order('test_name')
    .limit(200)

  const canWrite = canManageCatalogue(profile.role)

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <a href="/hospital/labs" className="text-sm text-neutral-500 hover:text-neutral-700">← Lab Orders</a>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Lab Test Catalogue</h1>
        </div>
      </div>

      {canWrite && <CatalogueForm />}

      <div className={t.wrapper}>
        <table className="w-full" aria-label="Lab test catalogue">
          <thead className={t.header}>
            <tr>
              <th className={t.headerCell}>Test Name</th>
              <th className={t.headerCell}>Code</th>
              <th className={t.headerCell}>Category</th>
              <th className={t.headerCell}>Sample</th>
              <th className={t.headerCell}>Normal Range</th>
              <th className={t.headerCell}>TAT (hrs)</th>
              <th className={t.headerCell}>Price</th>
            </tr>
          </thead>
          <tbody className={t.body}>
            {(!tests || tests.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-400">No tests in catalogue.</td></tr>
            )}
            {tests?.map((test) => (
              <tr key={test.id} className={t.row}>
                <td className={`${t.cell} font-medium text-neutral-900`}>{test.test_name}</td>
                <td className={`${t.cell} font-mono`}>{test.test_code ?? '—'}</td>
                <td className={t.cell}>{test.category ?? '—'}</td>
                <td className={t.cell}>{formatLabel(test.sample_type)}</td>
                <td className={t.cell}>{test.normal_range ? `${test.normal_range} ${test.unit ?? ''}` : '—'}</td>
                <td className={t.cell}>{test.turnaround_hours ?? '—'}</td>
                <td className={`${t.cell} font-mono`}>{test.price != null ? test.price.toFixed(2) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
