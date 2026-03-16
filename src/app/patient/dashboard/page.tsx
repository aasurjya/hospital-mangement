import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { card } from '@/lib/styles'
import Link from 'next/link'

export const metadata = { title: 'My Dashboard' }

export default async function PatientDashboardPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!
  const patientId = ctx.patientId

  const supabase = await createSupabaseServerClient()

  // Fetch all dashboard data in parallel
  const now = new Date().toISOString()
  const [nextAppt, currentAdmission, outstandingResult, unreadResult, patientData] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, scheduled_at, status, user_profiles!appointments_doctor_id_fkey(full_name)')
      .eq('patient_id', patientId)
      .eq('hospital_id', hospitalId)
      .gte('scheduled_at', now)
      .in('status', ['SCHEDULED', 'CONFIRMED'])
      .order('scheduled_at')
      .limit(1)
      .single(),
    supabase
      .from('admissions')
      .select('id, admitted_at, rooms(room_number), departments(name), user_profiles!admissions_doctor_id_fkey(full_name)')
      .eq('patient_id', patientId)
      .eq('hospital_id', hospitalId)
      .eq('status', 'ADMITTED')
      .limit(1)
      .single(),
    supabase
      .from('invoices')
      .select('total, amount_paid')
      .eq('patient_id', patientId)
      .eq('hospital_id', hospitalId)
      .in('status', ['ISSUED', 'PARTIAL']),
    supabase.rpc('get_unread_counts', { p_user_id: ctx.userId }),
    supabase
      .from('patients')
      .select('full_name')
      .eq('id', patientId)
      .single(),
  ])

  const appointment = nextAppt.data
  const admission = currentAdmission.data
  const outstanding = (outstandingResult.data ?? []).reduce(
    (sum, inv) => sum + ((inv.total ?? 0) - (inv.amount_paid ?? 0)), 0
  )
  const unreadCount = (unreadResult.data ?? []).reduce((sum, c) => sum + (c.unread_count ?? 0), 0)
  const patientName = (patientData.data as { full_name: string } | null)?.full_name ?? ctx.profile.full_name

  // Upcoming appointment reminder (within 48 hours)
  const hasUpcomingReminder = appointment && (
    new Date(appointment.scheduled_at).getTime() - Date.now() < 48 * 60 * 60 * 1000
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
        Welcome, {patientName}
      </h1>
      <p className="text-sm text-neutral-600 mb-6">Your health dashboard</p>

      {/* Upcoming appointment reminder */}
      {hasUpcomingReminder && appointment && (
        <div role="alert" className="mb-6 rounded-lg border border-caution-200 bg-caution-50 p-4">
          <p className="text-sm font-semibold text-caution-800">Upcoming Appointment</p>
          <p className="mt-1 text-sm text-caution-700">
            {new Date(appointment.scheduled_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
            {new Date(appointment.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            {(appointment.user_profiles as { full_name: string } | null)?.full_name &&
              ` with ${(appointment.user_profiles as { full_name: string }).full_name}`}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className={card.base}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Next Appointment</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">
            {appointment
              ? new Date(appointment.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'None'}
          </p>
        </div>
        <div className={card.base}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Admission</p>
          <p className={`mt-1 text-lg font-bold ${admission ? 'text-primary-700' : 'text-neutral-500'}`}>
            {admission ? 'Admitted' : 'Not admitted'}
          </p>
        </div>
        <div className={card.base}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Outstanding</p>
          <p className={`mt-1 text-lg font-bold ${outstanding > 0 ? 'text-error-700' : 'text-success-700'}`}>
            {outstanding > 0 ? outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
          </p>
        </div>
        <div className={card.base}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Unread Messages</p>
          <p className={`mt-1 text-lg font-bold ${unreadCount > 0 ? 'text-primary-700' : 'text-neutral-500'}`}>
            {unreadCount}
          </p>
        </div>
      </div>

      {/* Current admission details */}
      {admission && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Current Admission</h2>
          <div className={card.base}>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-500">Admitted</dt>
                <dd className="font-medium text-neutral-900">{new Date(admission.admitted_at).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Room</dt>
                <dd className="font-medium text-neutral-900">{(admission.rooms as { room_number: string } | null)?.room_number ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Department</dt>
                <dd className="font-medium text-neutral-900">{(admission.departments as { name: string } | null)?.name ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Doctor</dt>
                <dd className="font-medium text-neutral-900">{(admission.user_profiles as { full_name: string } | null)?.full_name ?? 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-base font-semibold text-neutral-900 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Book Appointment', href: '/patient/appointments/new' },
          { label: 'View Records', href: '/patient/records' },
          { label: 'Chat with Doctor', href: '/patient/chat' },
          { label: 'View Billing', href: '/patient/billing' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-primary-700 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
