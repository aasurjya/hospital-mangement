import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canManageFormulary } from '@/lib/prescriptions/permissions'
import { formatLabel } from '@/lib/format'
import { btn, table as t } from '@/lib/styles'
import Link from 'next/link'

export const metadata = { title: 'Drug Formulary' }

export default async function FormularyPage() {
  const { profile } = await requireAuth()
  const supabase = await createSupabaseServerClient()

  const { data: drugs } = await supabase
    .from('drug_formulary')
    .select('*')
    .eq('hospital_id', profile.hospital_id!)
    .order('generic_name')
    .limit(200)

  const canWrite = canManageFormulary(profile.role)

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Drug Formulary</h1>
        {canWrite && (
          <Link href="/hospital/formulary/new" className={btn.primary}>
            + Add Drug
          </Link>
        )}
      </div>

      <div className={t.wrapper}>
        <table className="w-full" aria-label="Drug formulary">
          <thead className={t.header}>
            <tr>
              <th className={t.headerCell}>Generic Name</th>
              <th className={t.headerCell}>Brand</th>
              <th className={t.headerCell}>Form</th>
              <th className={t.headerCell}>Strength</th>
              <th className={t.headerCell}>Category</th>
              <th className={t.headerCell}>Status</th>
            </tr>
          </thead>
          <tbody className={t.body}>
            {(!drugs || drugs.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-neutral-400">No drugs in formulary.</td></tr>
            )}
            {drugs?.map((d) => (
              <tr key={d.id} className={t.row}>
                <td className={`${t.cell} font-medium text-neutral-900`}>{d.generic_name}</td>
                <td className={t.cell}>{d.brand_name ?? '—'}</td>
                <td className={t.cell}>{formatLabel(d.form)}</td>
                <td className={t.cell}>{d.strength ?? '—'}</td>
                <td className={t.cell}>{formatLabel(d.category)}</td>
                <td className={t.cell}>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${d.is_active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
