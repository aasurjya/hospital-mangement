/**
 * Dashboard entry point — redirects to role-appropriate dashboard.
 */
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'

export default async function DashboardPage() {
  const { profile } = await requireAuth()

  switch (profile.role) {
    case 'PLATFORM_ADMIN':
      redirect('/platform/hospitals')
    case 'PATIENT':
      redirect('/patient/dashboard')
    case 'HOSPITAL_ADMIN':
      redirect('/hospital/dashboard')
    default:
      redirect('/hospital/dashboard')
  }
}
