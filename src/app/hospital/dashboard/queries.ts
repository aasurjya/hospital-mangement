/**
 * Dashboard data-fetching functions.
 * All queries are hospital-scoped. Doctors see only their own patients/appointments.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppRole } from '@/types/database'

// H4: use local midnight so "today" matches the server's local time,
// not UTC midnight. For multi-timezone hospitals, store timezone in DB.
function todayBounds(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export interface DashboardStats {
  admittedCount: number
  todayAppointmentCount: number
  availableRoomCount: number
  activePatientCount: number
}

export async function fetchDashboardStats(
  supabase: SupabaseClient,
  hospitalId: string,
  role: AppRole,
  userId: string
): Promise<DashboardStats> {
  const { start, end } = todayBounds()
  const isDoctor = role === 'DOCTOR'

  let admissionsQ = supabase
    .from('admissions')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', hospitalId)
    .eq('status', 'ADMITTED')
  if (isDoctor) admissionsQ = admissionsQ.eq('doctor_id', userId)

  // H3: exclude CANCELLED and NO_SHOW from today's appointment count
  let appointmentsQ = supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', hospitalId)
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .not('status', 'in', '("CANCELLED","NO_SHOW")')
  if (isDoctor) appointmentsQ = appointmentsQ.eq('doctor_id', userId)

  const roomsQ = supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', hospitalId)
    .eq('is_available', true)
    .eq('is_active', true)

  const patientsQ = supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)

  const [admissions, appointments, rooms, patients] = await Promise.all([
    admissionsQ,
    appointmentsQ,
    roomsQ,
    patientsQ,
  ])

  return {
    admittedCount: admissions.count ?? 0,
    todayAppointmentCount: appointments.count ?? 0,
    availableRoomCount: rooms.count ?? 0,
    activePatientCount: patients.count ?? 0,
  }
}

export interface RecentAdmission {
  id: string
  admitted_at: string
  status: string
  patientName: string
  patientId: string
  doctorName: string | null
  roomNumber: string | null
}

export async function fetchRecentAdmissions(
  supabase: SupabaseClient,
  hospitalId: string,
  role: AppRole,
  userId: string
): Promise<RecentAdmission[]> {
  let q = supabase
    .from('admissions')
    .select(`
      id, admitted_at, status,
      patients!inner(id, full_name),
      user_profiles!admissions_doctor_id_fkey(full_name),
      rooms(room_number)
    `)
    .eq('hospital_id', hospitalId)
    .eq('status', 'ADMITTED')
    .order('admitted_at', { ascending: false })
    .limit(5)

  if (role === 'DOCTOR') q = q.eq('doctor_id', userId)

  const { data } = await q
  if (!data) return []

  return data.map((row: Record<string, unknown>) => {
    const patient = row.patients as { id: string; full_name: string } | null
    const doctor = row.user_profiles as { full_name: string } | null
    const room = row.rooms as { room_number: string } | null
    return {
      id: row.id as string,
      admitted_at: row.admitted_at as string,
      status: row.status as string,
      patientName: patient?.full_name ?? 'Unknown',
      patientId: patient?.id ?? '',
      doctorName: doctor?.full_name ?? null,
      roomNumber: room?.room_number ?? null,
    }
  })
}

export interface TodayAppointment {
  id: string
  scheduled_at: string
  status: string
  patientName: string
  patientId: string
  doctorName: string | null
}

export async function fetchTodaysAppointments(
  supabase: SupabaseClient,
  hospitalId: string,
  role: AppRole,
  userId: string
): Promise<TodayAppointment[]> {
  const { start, end } = todayBounds()

  // H3: exclude CANCELLED and NO_SHOW from today's appointments list
  let q = supabase
    .from('appointments')
    .select(`
      id, scheduled_at, status,
      patients!inner(id, full_name),
      user_profiles!appointments_doctor_id_fkey(full_name)
    `)
    .eq('hospital_id', hospitalId)
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .not('status', 'in', '("CANCELLED","NO_SHOW")')
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (role === 'DOCTOR') q = q.eq('doctor_id', userId)

  const { data } = await q
  if (!data) return []

  return data.map((row: Record<string, unknown>) => {
    const patient = row.patients as { id: string; full_name: string } | null
    const doctor = row.user_profiles as { full_name: string } | null
    return {
      id: row.id as string,
      scheduled_at: row.scheduled_at as string,
      status: row.status as string,
      patientName: patient?.full_name ?? 'Unknown',
      patientId: patient?.id ?? '',
      doctorName: doctor?.full_name ?? null,
    }
  })
}
