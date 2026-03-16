import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { card } from '@/lib/styles'
import { EditProfileForm } from './edit-profile-form'

export const metadata = { title: 'My Profile' }

export default async function PatientProfilePage() {
  const ctx = await requirePatient()

  const supabase = await createSupabaseServerClient()
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', ctx.patientId)
    .single()

  if (!patient) return null

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">My Profile</h1>

      {/* Read-only medical info */}
      <div className={`${card.base} mb-6`}>
        <h2 className="text-base font-semibold text-neutral-900 mb-4">Medical Information</h2>
        <p className="text-xs text-neutral-500 mb-4">Managed by hospital staff. Contact your care team to update.</p>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Full Name</dt>
            <dd className="font-medium text-neutral-900">{patient.full_name}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">MRN</dt>
            <dd className="font-medium text-neutral-900">{patient.mrn}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Date of Birth</dt>
            <dd className="font-medium text-neutral-900">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Gender</dt>
            <dd className="font-medium text-neutral-900">{patient.gender ? formatLabel(patient.gender) : 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Blood Type</dt>
            <dd className="font-medium text-neutral-900">{patient.blood_type ?? 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Insurance</dt>
            <dd className="font-medium text-neutral-900">{patient.insurance_provider ?? 'N/A'}</dd>
          </div>
        </dl>

        {(patient.allergies || patient.medical_notes) && (
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
            {patient.allergies && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-error-600">Allergies</dt>
                <dd className="mt-1 text-sm text-neutral-900">{patient.allergies}</dd>
              </div>
            )}
            {patient.medical_notes && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Medical Notes</dt>
                <dd className="mt-1 text-sm text-neutral-900">{patient.medical_notes}</dd>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editable contact info */}
      <EditProfileForm initialData={{
        phone: patient.phone ?? '',
        email: patient.email ?? '',
        address: patient.address ?? '',
        emergency_contact_name: patient.emergency_contact_name ?? '',
        emergency_contact_phone: patient.emergency_contact_phone ?? '',
      }} />
    </div>
  )
}
