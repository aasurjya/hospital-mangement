'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { feedbackSchema } from '@/lib/patient/schemas'

export type FeedbackActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createFeedbackAction(
  _prev: FeedbackActionState,
  formData: FormData
): Promise<FeedbackActionState> {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = feedbackSchema.safeParse({
    appointment_id: (formData.get('appointment_id') as string) || undefined,
    admission_id: (formData.get('admission_id') as string) || undefined,
    rating: parseInt(formData.get('rating') as string, 10),
    comment: (formData.get('comment') as string) || undefined,
  })

  if (!parsed.success) {
    const issues = parsed.error.flatten()
    return { error: issues.formErrors[0] ?? 'Please fix the fields below.', fieldErrors: issues.fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Verify ownership of appointment/admission
  if (parsed.data.appointment_id) {
    const { data: appt } = await supabase
      .from('appointments')
      .select('id')
      .eq('id', parsed.data.appointment_id)
      .eq('patient_id', ctx.patientId)
      .eq('status', 'COMPLETED')
      .single()
    if (!appt) return { error: 'Appointment not found or not yet completed.' }
  }

  if (parsed.data.admission_id) {
    const { data: adm } = await supabase
      .from('admissions')
      .select('id')
      .eq('id', parsed.data.admission_id)
      .eq('patient_id', ctx.patientId)
      .eq('status', 'DISCHARGED')
      .single()
    if (!adm) return { error: 'Admission not found or not yet discharged.' }
  }

  const { error } = await supabase.from('feedback').insert({
    hospital_id: hospitalId,
    patient_id: ctx.patientId,
    appointment_id: parsed.data.appointment_id ?? null,
    admission_id: parsed.data.admission_id ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  })

  if (error) return { error: 'Failed to submit feedback.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: ctx.patientId,
    eventType: 'FEEDBACK_CREATED',
    description: `Patient submitted feedback (rating: ${parsed.data.rating}/5)`,
    metadata: { patientId: ctx.patientId, rating: parsed.data.rating },
  })

  revalidatePath('/patient/feedback')
  redirect('/patient/feedback')
}
