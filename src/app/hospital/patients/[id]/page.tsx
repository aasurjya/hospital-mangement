import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Patient Detail' }

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  const { id } = await params

  const supabase = await createSupabaseServerClient()

  const [{ data: patient }, { data: appointments }, { data: admissions }, { data: records }, { data: invoices }] =
    await Promise.all([
      supabase.from('patients').select('*').eq('id', id).eq('hospital_id', profile.hospital_id!).single(),
      supabase.from('appointments')
        .select('id, scheduled_at, status, reason, doctor_id')
        .eq('patient_id', id).order('scheduled_at', { ascending: false }).limit(5),
      supabase.from('admissions')
        .select('id, admitted_at, discharged_at, status, reason, bed_number')
        .eq('patient_id', id).order('admitted_at', { ascending: false }).limit(5),
      supabase.from('medical_records')
        .select('id, visit_date, chief_complaint, status')
        .eq('patient_id', id).order('visit_date', { ascending: false }).limit(5),
      supabase.from('invoices')
        .select('id, invoice_number, status, total, amount_paid, created_at')
        .eq('patient_id', id).eq('hospital_id', profile.hospital_id!).order('created_at', { ascending: false }).limit(5),
    ])

  if (!patient) notFound()

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000)
    : null

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <a href="/hospital/patients" className="text-sm text-neutral-500 hover:text-neutral-700">← Patients</a>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{patient.full_name}</h1>
          <p className="text-sm font-mono text-neutral-400">{patient.mrn}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/hospital/appointments/new?patientId=${id}`}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Book appointment
          </a>
          <a href={`/hospital/admissions/new?patientId=${id}`}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Admit
          </a>
        </div>
      </div>

      {/* Demographics */}
      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {[
          ['Age / DOB', age !== null ? `${age} yrs  (${new Date(patient.date_of_birth!).toLocaleDateString()})` : '—'],
          ['Gender', patient.gender],
          ['Blood type', patient.blood_type],
          ['Phone', patient.phone],
          ['Email', patient.email],
          ['Address', patient.address],
          ['Emergency contact', patient.emergency_contact_name
            ? `${patient.emergency_contact_name} — ${patient.emergency_contact_phone ?? ''}`
            : null],
          ['Insurance', patient.insurance_provider
            ? `${patient.insurance_provider} / ${patient.insurance_number ?? '—'}`
            : null],
        ].map(([label, value]) => value ? (
          <div key={label as string} className="flex px-4 py-3 text-sm">
            <span className="w-36 font-medium text-neutral-500">{label}</span>
            <span className="text-neutral-900">{value}</span>
          </div>
        ) : null)}
      </div>

      {/* Recent appointments */}
      <SummarySection
        title="Appointments"
        href={`/hospital/appointments?patientId=${id}`}
        newHref={`/hospital/appointments/new?patientId=${id}`}
        empty={!appointments?.length}
      >
        {appointments?.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
            <span className="text-neutral-700">{new Date(a.scheduled_at).toLocaleString()}</span>
            <span className="text-neutral-500">{a.reason ?? '—'}</span>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </SummarySection>

      {/* Recent admissions */}
      <SummarySection
        title="Admissions"
        href={`/hospital/admissions?patientId=${id}`}
        newHref={`/hospital/admissions/new?patientId=${id}`}
        empty={!admissions?.length}
      >
        {admissions?.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
            <span className="text-neutral-700">{new Date(a.admitted_at).toLocaleDateString()}</span>
            <span className="text-neutral-500">{a.reason ?? '—'}</span>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </SummarySection>

      {/* Medical records */}
      <SummarySection
        title="Medical records"
        href={`/hospital/records?patientId=${id}`}
        newHref={`/hospital/records/new?patientId=${id}`}
        empty={!records?.length}
      >
        {records?.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
            <span className="text-neutral-700">{new Date(r.visit_date).toLocaleDateString()}</span>
            <span className="text-neutral-500 flex-1 mx-4 truncate">{r.chief_complaint ?? '—'}</span>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </SummarySection>

      {/* Billing */}
      <SummarySection
        title="Billing"
        href={`/hospital/billing?q=${patient.mrn}`}
        newHref={`/hospital/billing/new?patientId=${id}`}
        empty={!invoices?.length}
      >
        {invoices?.map((inv) => {
          const balance = inv.total - inv.amount_paid
          return (
            <div key={inv.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
              <a href={`/hospital/billing/${inv.id}`} className="font-mono text-primary-600 hover:text-primary-800">
                {inv.invoice_number}
              </a>
              <span className="text-neutral-700 font-mono">{inv.total.toFixed(2)}</span>
              {balance > 0 && (
                <span className="text-error-600 font-mono text-xs">Due: {balance.toFixed(2)}</span>
              )}
              <StatusBadge status={inv.status} />
            </div>
          )
        })}
      </SummarySection>
    </div>
  )
}

function SummarySection({
  title, href, newHref, empty, children,
}: {
  title: string; href: string; newHref: string; empty: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-medium text-neutral-900">{title}</h2>
        <div className="flex gap-3 text-sm">
          <a href={newHref} className="text-primary-600 hover:text-primary-800">+ New</a>
          <a href={href} className="text-neutral-500 hover:text-neutral-700">View all →</a>
        </div>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-2">
        {empty ? <p className="text-sm text-neutral-400 py-2">None yet.</p> : children}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-primary-100 text-primary-700',
    CONFIRMED: 'bg-secondary-100 text-secondary-700',
    COMPLETED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-error-100 text-error-700',
    NO_SHOW: 'bg-neutral-100 text-neutral-500',
    ADMITTED: 'bg-caution-100 text-caution-700',
    DISCHARGED: 'bg-success-100 text-success-700',
    TRANSFERRED: 'bg-caution-100 text-caution-700',
    DRAFT: 'bg-neutral-100 text-neutral-500',
    FINALIZED: 'bg-success-100 text-success-700',
    PAID: 'bg-success-100 text-success-700',
    PARTIAL: 'bg-caution-100 text-caution-800',
    ISSUED: 'bg-primary-100 text-primary-700',
    VOID: 'bg-neutral-100 text-neutral-500',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-neutral-100 text-neutral-500'}`}>
      {status}
    </span>
  )
}
