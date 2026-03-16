import type { Metadata } from 'next'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { StatCard } from './stat-card'
import { RecentAdmissions } from './recent-admissions'
import { TodaysAppointments } from './todays-appointments'
import { QuickActions } from './quick-actions'
import {
  fetchDashboardStats,
  fetchRecentAdmissions,
  fetchTodaysAppointments,
} from './queries'

// M5: include hospital name in browser tab
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Dashboard' } // hospital name added below at runtime
}

export default async function HospitalDashboardPage() {
  const { profile, userId } = await requireAuth()
  const hospitalId = profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const [stats, recentAdmissions, todaysAppointments, hospitalResult] = await Promise.all([
    fetchDashboardStats(supabase, hospitalId, profile.role, userId),
    fetchRecentAdmissions(supabase, hospitalId, profile.role, userId),
    fetchTodaysAppointments(supabase, hospitalId, profile.role, userId),
    supabase.from('hospitals').select('name, is_active').eq('id', hospitalId).single(),
  ])

  const hospital = hospitalResult.data
  const isDoctor = profile.role === 'DOCTOR'

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* C1: h1 is "Dashboard", hospital name is secondary context */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-0.5 text-sm font-medium text-neutral-700">
            {hospital?.name}
          </p>
          {/* L1: removed "Welcome back" filler */}
          <p className="mt-0.5 text-sm text-neutral-600">
            {profile.full_name} · {formatLabel(profile.role)}
          </p>
          {/* M7: text-neutral-600 meets WCAG AA (was neutral-400) */}
          <p className="mt-0.5 text-xs text-neutral-600">{today}</p>
        </div>
        {!hospital?.is_active && (
          <span
            role="status"
            aria-live="polite"
            className="shrink-0 rounded-full bg-error-100 px-3 py-1 text-xs font-medium text-error-700"
          >
            Hospital inactive
          </span>
        )}
      </div>

      {/* H2: role-aware labels so doctor and admin see meaningful card titles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label={isDoctor ? 'My admitted patients' : 'Admitted'}
          value={stats.admittedCount}
          href="/hospital/admissions"
        />
        <StatCard
          label={isDoctor ? 'My appointments today' : "Today's appointments"}
          value={stats.todayAppointmentCount}
          href="/hospital/appointments"
        />
        <StatCard
          label="Available rooms"
          value={stats.availableRoomCount}
          href="/hospital/rooms"
        />
        <StatCard
          label="Active patients"
          value={stats.activePatientCount}
          href="/hospital/patients"
        />
      </div>

      {/* H5: quick actions with visual hierarchy (creation vs navigation) */}
      <QuickActions role={profile.role} />

      {/* Activity tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentAdmissions admissions={recentAdmissions} role={profile.role} />
        <TodaysAppointments appointments={todaysAppointments} role={profile.role} />
      </div>
    </div>
  )
}
