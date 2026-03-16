import type { SupabaseClient } from '@supabase/supabase-js'
import type { StaffReport } from '@/lib/reports/types'

export async function fetchStaffReport(
  supabase: SupabaseClient,
  hospitalId: string,
  dateRange: { start: string; end: string }
): Promise<StaffReport> {
  // Fetch all active doctors
  const { data: doctors } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('hospital_id', hospitalId)
    .eq('role', 'DOCTOR')
    .eq('is_active', true)
    .order('full_name')

  if (!doctors || doctors.length === 0) {
    return { byDoctor: [] }
  }

  const doctorIds = doctors.map((d) => d.id)

  // Fetch all metrics in parallel using grouped queries
  const [activeAdmissionsResult, periodAdmissionsResult, appointmentsResult, recordsResult] = await Promise.all([
    // Active patients (current, no date range)
    supabase
      .from('admissions')
      .select('doctor_id')
      .eq('hospital_id', hospitalId)
      .eq('status', 'ADMITTED')
      .in('doctor_id', doctorIds),
    // Admissions in period
    supabase
      .from('admissions')
      .select('doctor_id')
      .eq('hospital_id', hospitalId)
      .in('doctor_id', doctorIds)
      .gte('admitted_at', dateRange.start)
      .lt('admitted_at', dateRange.end),
    // Appointments in period
    supabase
      .from('appointments')
      .select('doctor_id')
      .eq('hospital_id', hospitalId)
      .in('doctor_id', doctorIds)
      .gte('scheduled_at', dateRange.start)
      .lt('scheduled_at', dateRange.end),
    // Records in period
    supabase
      .from('medical_records')
      .select('author_id')
      .eq('hospital_id', hospitalId)
      .in('author_id', doctorIds)
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end),
  ])

  // Count by doctor_id
  function countBy(data: { doctor_id?: string | null; author_id?: string | null }[] | null, field: 'doctor_id' | 'author_id'): Map<string, number> {
    const map = new Map<string, number>()
    for (const row of data ?? []) {
      const id = row[field]
      if (id) map.set(id, (map.get(id) ?? 0) + 1)
    }
    return map
  }

  const activeCounts = countBy(activeAdmissionsResult.data, 'doctor_id')
  const admissionCounts = countBy(periodAdmissionsResult.data, 'doctor_id')
  const appointmentCounts = countBy(appointmentsResult.data, 'doctor_id')
  const recordCounts = countBy(recordsResult.data, 'author_id')

  const byDoctor = doctors.map((d) => ({
    doctorName: d.full_name,
    activePatients: activeCounts.get(d.id) ?? 0,
    admissions: admissionCounts.get(d.id) ?? 0,
    appointments: appointmentCounts.get(d.id) ?? 0,
    records: recordCounts.get(d.id) ?? 0,
  }))

  return { byDoctor }
}
