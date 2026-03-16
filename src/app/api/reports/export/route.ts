import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canViewReports } from '@/lib/reports/permissions'
import { getDateRange, VALID_PERIODS } from '@/lib/reports/periods'
import type { ReportPeriod } from '@/lib/reports/periods'
import { generateCsv } from '@/lib/reports/csv'
import { fetchOccupancyReport } from '@/app/hospital/reports/queries/occupancy'
import { fetchFinancialReport } from '@/app/hospital/reports/queries/financial'
import { fetchPatientReport } from '@/app/hospital/reports/queries/patients'
import { fetchAppointmentReport } from '@/app/hospital/reports/queries/appointments'
import { fetchStaffReport } from '@/app/hospital/reports/queries/staff'
import type { AppRole } from '@/types/database'

const VALID_TABS = ['occupancy', 'financial', 'patients', 'appointments', 'staff']

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('hospital_id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active || !canViewReports(profile.role as AppRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tab = request.nextUrl.searchParams.get('tab') ?? ''
  const period = request.nextUrl.searchParams.get('period') ?? 'this_month'

  if (!VALID_TABS.includes(tab)) {
    return NextResponse.json({ error: 'Invalid tab parameter' }, { status: 400 })
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 })
  }

  const hospitalId = profile.hospital_id
  if (!hospitalId) return NextResponse.json({ error: 'No hospital assigned' }, { status: 403 })
  const dateRange = getDateRange(period as ReportPeriod)
  const today = new Date().toISOString().slice(0, 10)
  let csv = ''
  let filename = `${tab}-report-${today}.csv`

  switch (tab) {
    case 'occupancy': {
      const data = await fetchOccupancyReport(supabase, hospitalId)
      csv = generateCsv(data.byRoomType, [
        { key: 'roomType', header: 'Room Type' },
        { key: 'total', header: 'Total' },
        { key: 'occupied', header: 'Occupied' },
        { key: 'available', header: 'Available' },
        { key: 'rate', header: 'Occupancy %' },
      ])
      break
    }
    case 'financial': {
      const data = await fetchFinancialReport(supabase, hospitalId, dateRange)
      const statusRows = data.byStatus.map((r) => ({ ...r, section: 'Invoice Status' }))
      const methodRows = data.byPaymentMethod.map((r) => ({
        status: r.method,
        count: r.count,
        total: r.amount,
        section: 'Payment Method',
      }))
      csv = generateCsv([...statusRows, ...methodRows], [
        { key: 'section', header: 'Section' },
        { key: 'status', header: 'Category' },
        { key: 'count', header: 'Count' },
        { key: 'total', header: 'Amount' },
      ])
      break
    }
    case 'patients': {
      const data = await fetchPatientReport(supabase, hospitalId, dateRange)
      csv = generateCsv(data.byDepartment, [
        { key: 'departmentName', header: 'Department' },
        { key: 'admissions', header: 'Admissions' },
        { key: 'discharges', header: 'Discharges' },
      ])
      break
    }
    case 'appointments': {
      const data = await fetchAppointmentReport(supabase, hospitalId, dateRange)
      csv = generateCsv(data.byDoctor, [
        { key: 'doctorName', header: 'Doctor' },
        { key: 'total', header: 'Total' },
        { key: 'completed', header: 'Completed' },
        { key: 'noShows', header: 'No-Shows' },
      ])
      break
    }
    case 'staff': {
      const data = await fetchStaffReport(supabase, hospitalId, dateRange)
      csv = generateCsv(data.byDoctor, [
        { key: 'doctorName', header: 'Doctor' },
        { key: 'activePatients', header: 'Active Patients' },
        { key: 'admissions', header: 'Admissions' },
        { key: 'appointments', header: 'Appointments' },
        { key: 'records', header: 'Records' },
      ])
      break
    }
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
