import { createSupabaseServiceClient } from '@/lib/supabase/server'

export interface PatientContext {
  fullName: string
  dateOfBirth?: string
  age?: number
  gender?: string
  bloodType?: string
  allergies?: string
  medicalNotes?: string
  recentRecords?: string[]
  admissionHistory?: string[]
  recentAppointments?: string[]
}

export async function fetchPatientContext(
  patientId: string,
  hospitalId: string
): Promise<PatientContext | null> {
  const supabase = createSupabaseServiceClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('full_name, date_of_birth, gender, blood_type, allergies, medical_notes')
    .eq('id', patientId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!patient) return null

  // Fetch recent clinical data in parallel
  const [recordsResult, admissionsResult, appointmentsResult] = await Promise.all([
    supabase
      .from('medical_records')
      .select('visit_date, chief_complaint, notes')
      .eq('patient_id', patientId)
      .eq('status', 'FINALIZED')
      .order('visit_date', { ascending: false })
      .limit(10),
    supabase
      .from('admissions')
      .select('admitted_at, discharged_at, status, reason')
      .eq('patient_id', patientId)
      .order('admitted_at', { ascending: false })
      .limit(5),
    supabase
      .from('appointments')
      .select('scheduled_at, status, reason')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
      .limit(10),
  ])

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined

  return {
    fullName: patient.full_name,
    dateOfBirth: patient.date_of_birth ?? undefined,
    age,
    gender: patient.gender ?? undefined,
    bloodType: patient.blood_type ?? undefined,
    allergies: patient.allergies ?? undefined,
    medicalNotes: patient.medical_notes ?? undefined,
    recentRecords: (recordsResult.data ?? []).map((r) =>
      `[${r.visit_date}] ${r.chief_complaint ?? 'No complaint'}: ${(r.notes ?? '').slice(0, 200)}`
    ),
    admissionHistory: (admissionsResult.data ?? []).map((a) =>
      `[${a.admitted_at}] ${a.status} - ${a.reason ?? 'No reason'}`
    ),
    recentAppointments: (appointmentsResult.data ?? []).map((a) =>
      `[${a.scheduled_at}] ${a.status} - ${a.reason ?? 'No reason'}`
    ),
  }
}

export function formatPatientContextForPrompt(ctx: PatientContext): string {
  const lines = [
    `Patient: ${ctx.fullName}`,
    ctx.age !== undefined ? `Age: ${ctx.age}` : null,
    ctx.gender ? `Gender: ${ctx.gender}` : null,
    ctx.bloodType ? `Blood Type: ${ctx.bloodType}` : null,
    ctx.allergies ? `Known Allergies: ${ctx.allergies}` : null,
    ctx.medicalNotes ? `Medical Notes: ${ctx.medicalNotes}` : null,
  ].filter(Boolean)

  if (ctx.recentRecords && ctx.recentRecords.length > 0) {
    lines.push('', 'Recent Medical Records:', ...ctx.recentRecords)
  }
  if (ctx.admissionHistory && ctx.admissionHistory.length > 0) {
    lines.push('', 'Admission History:', ...ctx.admissionHistory)
  }
  if (ctx.recentAppointments && ctx.recentAppointments.length > 0) {
    lines.push('', 'Recent Appointments:', ...ctx.recentAppointments)
  }

  return lines.join('\n')
}
