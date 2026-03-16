import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewFeedbackForm } from './new-feedback-form'

export const metadata = { title: 'Submit Feedback' }

export default async function NewFeedbackPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  // Fetch completed appointments and discharged admissions that haven't been reviewed yet
  const [apptsResult, admissionsResult, existingFeedback] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, scheduled_at, user_profiles!appointments_doctor_id_fkey(full_name)')
      .eq('patient_id', ctx.patientId)
      .eq('hospital_id', hospitalId)
      .eq('status', 'COMPLETED')
      .order('scheduled_at', { ascending: false })
      .limit(20),
    supabase
      .from('admissions')
      .select('id, admitted_at, discharged_at, departments(name)')
      .eq('patient_id', ctx.patientId)
      .eq('hospital_id', hospitalId)
      .eq('status', 'DISCHARGED')
      .order('discharged_at', { ascending: false })
      .limit(20),
    supabase
      .from('feedback')
      .select('appointment_id, admission_id')
      .eq('patient_id', ctx.patientId)
      .eq('hospital_id', hospitalId),
  ])

  // Filter out already-reviewed items
  const reviewedAppointmentIds = new Set(
    (existingFeedback.data ?? []).map((f) => f.appointment_id).filter(Boolean)
  )
  const reviewedAdmissionIds = new Set(
    (existingFeedback.data ?? []).map((f) => f.admission_id).filter(Boolean)
  )

  const options = [
    ...(apptsResult.data ?? [])
      .filter((a) => !reviewedAppointmentIds.has(a.id))
      .map((a) => {
        const doctor = a.user_profiles as { full_name: string } | null
        return {
          id: a.id,
          label: `Appointment on ${new Date(a.scheduled_at).toLocaleDateString()}${doctor ? ` with ${doctor.full_name}` : ''}`,
          type: 'appointment' as const,
        }
      }),
    ...(admissionsResult.data ?? [])
      .filter((a) => !reviewedAdmissionIds.has(a.id))
      .map((a) => {
        const dept = a.departments as { name: string } | null
        return {
          id: a.id,
          label: `Admission${dept ? ` (${dept.name})` : ''} discharged ${a.discharged_at ? new Date(a.discharged_at).toLocaleDateString() : ''}`,
          type: 'admission' as const,
        }
      }),
  ]

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <a href="/patient/feedback" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Feedback</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Submit Feedback</h1>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewFeedbackForm options={options} />
      </div>
    </div>
  )
}
