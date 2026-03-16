import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { card, btn } from '@/lib/styles'

export const metadata = { title: 'My Feedback' }

export default async function PatientFeedbackPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: feedbacks } = await supabase
    .from('feedback')
    .select('id, rating, comment, created_at, appointment_id, admission_id')
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">My Feedback</h1>
        <a href="/patient/feedback/new" className={btn.primary}>Submit Feedback</a>
      </div>

      {!feedbacks || feedbacks.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No feedback submitted yet.</p>
          <a href="/patient/feedback/new" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
            Share your experience
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className={card.base}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < fb.rating ? 'text-caution-500' : 'text-neutral-200'}`}>
                      &#9733;
                    </span>
                  ))}
                </div>
                <span className="text-xs text-neutral-500">{new Date(fb.created_at).toLocaleDateString()}</span>
              </div>
              {fb.comment && <p className="text-sm text-neutral-700">{fb.comment}</p>}
              <p className="mt-1 text-xs text-neutral-400">
                {fb.appointment_id ? 'Appointment feedback' : fb.admission_id ? 'Admission feedback' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
