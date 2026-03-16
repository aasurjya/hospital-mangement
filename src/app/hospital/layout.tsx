/**
 * Hospital layout — guards all /hospital/* routes.
 * Requires HOSPITAL_ADMIN or any active hospital staff role.
 */
import { requireAuth } from '@/lib/rbac/guards'
import { redirect } from 'next/navigation'
import { isHospitalStaff } from '@/lib/rbac/roles'
import { HospitalNav } from '@/components/hospital-nav'

export default async function HospitalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireAuth()

  // Platform admins should use /platform/* routes
  if (ctx.profile.role === 'PLATFORM_ADMIN') {
    redirect('/platform/hospitals')
  }

  // Patients have their own portal
  if (ctx.profile.role === 'PATIENT') {
    redirect('/patient/dashboard')
  }

  // Must be a hospital staff member with an assigned hospital
  if (!isHospitalStaff(ctx.profile.role)) {
    redirect('/unauthorized')
  }

  if (!ctx.profile.hospital_id) {
    redirect('/unauthorized')
  }

  const isAdmin = ctx.profile.role === 'HOSPITAL_ADMIN'

  return (
    <div className="min-h-screen bg-neutral-50">
      <HospitalNav
        userFullName={ctx.profile.full_name}
        userRole={ctx.profile.role}
        isAdmin={isAdmin}
        isPatient={false}
      />
      <div className="h-16" aria-hidden="true" />
      <main id="main-content">{children}</main>
    </div>
  )
}
