import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { statusBadge } from '@/lib/styles'

export const metadata = { title: 'Visit History' }

interface TimelineEvent {
  id: string
  date: string
  type: 'appointment' | 'admission' | 'record' | 'invoice'
  label: string
  detail: string
  status: string
}

export default async function PatientHistoryPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const [apptsResult, admResult, recsResult, invResult] = await Promise.all([
    supabase.from('appointments').select('id, scheduled_at, status, reason').eq('patient_id', ctx.patientId).eq('hospital_id', hospitalId).order('scheduled_at', { ascending: false }).limit(100),
    supabase.from('admissions').select('id, admitted_at, status, reason').eq('patient_id', ctx.patientId).eq('hospital_id', hospitalId).order('admitted_at', { ascending: false }).limit(50),
    supabase.from('medical_records').select('id, visit_date, chief_complaint, status').eq('patient_id', ctx.patientId).eq('hospital_id', hospitalId).eq('status', 'FINALIZED').order('visit_date', { ascending: false }).limit(50),
    supabase.from('invoices').select('id, created_at, invoice_number, status, total').eq('patient_id', ctx.patientId).eq('hospital_id', hospitalId).neq('status', 'DRAFT').order('created_at', { ascending: false }).limit(50),
  ])

  const events: TimelineEvent[] = []

  for (const a of apptsResult.data ?? []) {
    events.push({ id: `appt-${a.id}`, date: a.scheduled_at, type: 'appointment', label: 'Appointment', detail: a.reason ?? '', status: a.status })
  }
  for (const a of admResult.data ?? []) {
    events.push({ id: `adm-${a.id}`, date: a.admitted_at, type: 'admission', label: 'Admission', detail: a.reason ?? '', status: a.status })
  }
  for (const r of recsResult.data ?? []) {
    events.push({ id: `rec-${r.id}`, date: r.visit_date, type: 'record', label: 'Medical Record', detail: r.chief_complaint ?? '', status: r.status })
  }
  for (const i of invResult.data ?? []) {
    events.push({ id: `inv-${i.id}`, date: i.created_at, type: 'invoice', label: `Invoice ${i.invoice_number}`, detail: `Total: ${(i.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, status: i.status })
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const typeColors: Record<string, string> = {
    appointment: 'bg-primary-100 text-primary-700',
    admission: 'bg-secondary-100 text-secondary-700',
    record: 'bg-success-100 text-success-700',
    invoice: 'bg-caution-100 text-caution-800',
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Visit History</h1>

      {events.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No visit history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const badgeKey = event.status as keyof typeof statusBadge
            return (
              <div key={event.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3 flex items-start gap-3">
                <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${typeColors[event.type] ?? ''}`}>
                  {event.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900">
                    {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    {event.detail && <span className="text-neutral-600"> &mdash; {event.detail.length > 80 ? event.detail.slice(0, 80) + '\u2026' : event.detail}</span>}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusBadge[badgeKey] ?? statusBadge.inactive}`}>
                  {formatLabel(event.status)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
