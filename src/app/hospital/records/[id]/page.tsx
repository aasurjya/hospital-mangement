import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { FinalizeButton } from './finalize-button'
import type { RecordStatus } from '@/types/database'

export const metadata = { title: 'Medical Record' }

type RecordDetail = {
  id: string
  created_at: string
  status: RecordStatus
  chief_complaint: string | null
  notes: string | null
  visit_date: string
  finalized_at: string | null
  patients: { id: string; full_name: string; mrn: string } | null
  user_profiles: { full_name: string } | null
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAuth()

  const supabase = await createSupabaseServerClient()
  const { data: record } = await supabase
    .from('medical_records')
    .select(`
      id, created_at, status, chief_complaint, notes, visit_date,
      finalized_at,
      patients!inner(id, full_name, mrn),
      user_profiles!medical_records_author_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!record) notFound()
  const r = record as unknown as RecordDetail

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <a href="/hospital/records" className="text-sm text-neutral-500 hover:text-neutral-700">← Records</a>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Medical Record</h1>
          <p className="text-sm text-neutral-500">
            Created {new Date(r.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`mt-8 inline-flex rounded-full px-3 py-1 text-xs font-medium ${r.status === 'FINALIZED' ? 'bg-success-100 text-success-700' : 'bg-caution-100 text-caution-700'}`}>
          {r.status}
        </span>
      </div>

      <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
        <Section label="Patient">
          {r.patients ? (
            <a href={`/hospital/patients/${r.patients.id}`} className="font-medium text-primary-600 hover:text-primary-800">
              {r.patients.full_name} <span className="text-neutral-400 font-normal">({r.patients.mrn})</span>
            </a>
          ) : '—'}
        </Section>

        <Section label="Doctor">
          {r.user_profiles?.full_name ?? '—'}
        </Section>

        <Section label="Visit date">
          {r.visit_date}
        </Section>

        <Section label="Chief complaint">
          {r.chief_complaint ?? <span className="text-neutral-400 italic">Not recorded</span>}
        </Section>

        <Section label="Notes">
          {r.notes ?? <span className="text-neutral-400 italic">None</span>}
        </Section>

        {r.status === 'FINALIZED' && r.finalized_at && (
          <Section label="Finalized">
            {new Date(r.finalized_at).toLocaleString()}
          </Section>
        )}
      </div>

      {r.status === 'DRAFT' && (
        <div className="mt-4 flex gap-3">
          <FinalizeButton recordId={r.id} />
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900 whitespace-pre-wrap">{children}</dd>
    </div>
  )
}
