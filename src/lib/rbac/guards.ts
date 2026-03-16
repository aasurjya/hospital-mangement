/**
 * Server-side route and action guards.
 * Import and call these at the top of server actions and route handlers.
 * They throw redirect errors (for pages) or return error responses (for API routes).
 */
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AppRole, UserProfile } from '@/types/database'
import { isPlatformAdmin, isPatient } from './roles'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export interface AuthContext {
  userId: string
  email: string
  profile: UserProfile
}

/**
 * Require an authenticated session. Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    redirect('/login?error=account_inactive')
  }

  return {
    userId: user.id,
    email: user.email!,
    profile,
  }
}

/**
 * Require PLATFORM_ADMIN role. Redirects to /unauthorized if insufficient.
 */
export async function requirePlatformAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth()

  if (!isPlatformAdmin(ctx.profile.role)) {
    redirect('/unauthorized')
  }

  return ctx
}

/**
 * Require HOSPITAL_ADMIN or PLATFORM_ADMIN role.
 */
export async function requireHospitalAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth()

  if (ctx.profile.role !== 'HOSPITAL_ADMIN' && !isPlatformAdmin(ctx.profile.role)) {
    redirect('/unauthorized')
  }

  return ctx
}

/**
 * Require any of the specified roles.
 */
export async function requireRoles(allowed: AppRole[]): Promise<AuthContext> {
  const ctx = await requireAuth()

  if (!allowed.includes(ctx.profile.role) && !isPlatformAdmin(ctx.profile.role)) {
    redirect('/unauthorized')
  }

  return ctx
}

export interface PatientAuthContext extends AuthContext {
  patientId: string
}

/**
 * Require PATIENT role with a linked patient record.
 */
export async function requirePatient(): Promise<PatientAuthContext> {
  const ctx = await requireAuth()

  if (!isPatient(ctx.profile.role)) {
    redirect('/unauthorized')
  }

  const supabase = createSupabaseServiceClient()
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('hospital_id', ctx.profile.hospital_id!)
    .single()

  if (!patient) {
    redirect('/unauthorized?error=no_patient_record')
  }

  return { ...ctx, patientId: patient.id }
}

/**
 * Verify the actor belongs to the same hospital as the target hospital_id.
 * Platform admins bypass this check.
 */
export function assertSameHospital(
  ctx: AuthContext,
  targetHospitalId: string
): void {
  if (isPlatformAdmin(ctx.profile.role)) return

  if (ctx.profile.hospital_id !== targetHospitalId) {
    redirect('/unauthorized')
  }
}
