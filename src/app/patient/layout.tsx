import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { isPatient } from '@/lib/rbac/roles'
import { PatientNav } from '@/components/patient-nav'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireAuth()

  if (!isPatient(ctx.profile.role)) {
    redirect('/unauthorized')
  }

  if (!ctx.profile.hospital_id) {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <PatientNav patientName={ctx.profile.full_name} />
      <div className="h-16" aria-hidden="true" />
      <main id="main-content">{children}</main>
    </div>
  )
}
