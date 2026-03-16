import type { SupabaseClient } from '@supabase/supabase-js'
import type { PatientReport } from '@/lib/reports/types'

export async function fetchPatientReport(
  supabase: SupabaseClient,
  hospitalId: string,
  dateRange: { start: string; end: string }
): Promise<PatientReport> {
  const [admissionsResult, dischargesResult, newPatientsResult, departmentsResult] = await Promise.all([
    supabase
      .from('admissions')
      .select('id, admitted_at, discharged_at, department_id')
      .eq('hospital_id', hospitalId)
      .gte('admitted_at', dateRange.start)
      .lt('admitted_at', dateRange.end),
    supabase
      .from('admissions')
      .select('id, admitted_at, discharged_at, department_id')
      .eq('hospital_id', hospitalId)
      .eq('status', 'DISCHARGED')
      .gte('discharged_at', dateRange.start)
      .lt('discharged_at', dateRange.end),
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end),
    supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true),
  ])

  const admissions = admissionsResult.data ?? []
  const discharges = dischargesResult.data ?? []
  const departments = departmentsResult.data ?? []

  // Average length of stay (only for discharged admissions with both dates)
  const stayDays: number[] = []
  for (const d of discharges) {
    if (d.admitted_at && d.discharged_at) {
      const days = (new Date(d.discharged_at).getTime() - new Date(d.admitted_at).getTime()) / (1000 * 60 * 60 * 24)
      if (days >= 0) stayDays.push(days)
    }
  }
  const avgLengthOfStayDays = stayDays.length > 0
    ? Math.round((stayDays.reduce((a, b) => a + b, 0) / stayDays.length) * 10) / 10
    : 0

  // By department
  const deptNameMap = new Map(departments.map((d) => [d.id, d.name]))
  const deptAdmissions = new Map<string, number>()
  const deptDischarges = new Map<string, number>()

  for (const a of admissions) {
    if (a.department_id) {
      deptAdmissions.set(a.department_id, (deptAdmissions.get(a.department_id) ?? 0) + 1)
    }
  }
  for (const d of discharges) {
    if (d.department_id) {
      deptDischarges.set(d.department_id, (deptDischarges.get(d.department_id) ?? 0) + 1)
    }
  }

  const allDeptIds = new Set([...deptAdmissions.keys(), ...deptDischarges.keys()])
  const byDepartment = [...allDeptIds]
    .map((id) => ({
      departmentName: deptNameMap.get(id) ?? 'Unknown',
      admissions: deptAdmissions.get(id) ?? 0,
      discharges: deptDischarges.get(id) ?? 0,
    }))
    .sort((a, b) => b.admissions - a.admissions)

  return {
    totalAdmissions: admissions.length,
    totalDischarges: discharges.length,
    avgLengthOfStayDays,
    newPatients: newPatientsResult.count ?? 0,
    byDepartment,
  }
}
