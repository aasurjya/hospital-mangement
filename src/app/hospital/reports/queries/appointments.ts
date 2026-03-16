import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppointmentReport } from '@/lib/reports/types'

export async function fetchAppointmentReport(
  supabase: SupabaseClient,
  hospitalId: string,
  dateRange: { start: string; end: string }
): Promise<AppointmentReport> {
  const [appointmentsResult, doctorsResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, status, doctor_id, scheduled_at')
      .eq('hospital_id', hospitalId)
      .gte('scheduled_at', dateRange.start)
      .lt('scheduled_at', dateRange.end),
    supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('hospital_id', hospitalId)
      .eq('role', 'DOCTOR')
      .eq('is_active', true),
  ])

  const appointments = appointmentsResult.data ?? []
  const doctors = doctorsResult.data ?? []
  const doctorNameMap = new Map(doctors.map((d) => [d.id, d.full_name]))

  const totalAppointments = appointments.length
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length
  const noShowCount = appointments.filter((a) => a.status === 'NO_SHOW').length
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length
  const noShowRate = totalAppointments > 0
    ? Math.round((noShowCount / totalAppointments) * 100)
    : 0

  // By doctor
  const doctorMap = new Map<string, { total: number; completed: number; noShows: number }>()
  for (const appt of appointments) {
    if (!appt.doctor_id) continue
    const entry = doctorMap.get(appt.doctor_id) ?? { total: 0, completed: 0, noShows: 0 }
    entry.total += 1
    if (appt.status === 'COMPLETED') entry.completed += 1
    if (appt.status === 'NO_SHOW') entry.noShows += 1
    doctorMap.set(appt.doctor_id, entry)
  }
  const byDoctor = [...doctorMap.entries()]
    .map(([id, data]) => ({
      doctorName: doctorNameMap.get(id) ?? 'Unknown',
      ...data,
    }))
    .sort((a, b) => b.total - a.total)

  // Busiest hours
  const hourCounts = new Map<number, number>()
  for (const appt of appointments) {
    const hour = new Date(appt.scheduled_at).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }
  const busiestHours = [...hourCounts.entries()]
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return { totalAppointments, completedCount, noShowCount, cancelledCount, noShowRate, byDoctor, busiestHours }
}
