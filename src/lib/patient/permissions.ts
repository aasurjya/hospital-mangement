import type { AppointmentStatus, AdmissionStatus } from '@/types/database'

/** Patient can only cancel SCHEDULED appointments */
export function canCancelAppointment(status: AppointmentStatus): boolean {
  return status === 'SCHEDULED'
}

/** Patient can submit feedback on COMPLETED appointments or DISCHARGED admissions */
export function canSubmitFeedback(
  appointmentStatus: AppointmentStatus | null,
  admissionStatus: AdmissionStatus | null
): boolean {
  return appointmentStatus === 'COMPLETED' || admissionStatus === 'DISCHARGED'
}

/** Fields patients are allowed to edit on their own record */
const EDITABLE_FIELDS = new Set([
  'phone', 'email', 'address',
  'emergency_contact_name', 'emergency_contact_phone',
])

export function isEditableContactField(field: string): boolean {
  return EDITABLE_FIELDS.has(field)
}
