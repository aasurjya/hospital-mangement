export interface OccupancyReport {
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  occupancyRate: number
  byRoomType: Array<{
    roomType: string
    total: number
    occupied: number
    available: number
    rate: number
  }>
}

export interface FinancialReport {
  totalRevenue: number
  outstandingAmount: number
  invoiceCount: number
  paidCount: number
  byStatus: Array<{ status: string; count: number; total: number }>
  byPaymentMethod: Array<{ method: string; count: number; amount: number }>
}

export interface PatientReport {
  totalAdmissions: number
  totalDischarges: number
  avgLengthOfStayDays: number
  newPatients: number
  byDepartment: Array<{
    departmentName: string
    admissions: number
    discharges: number
  }>
}

export interface AppointmentReport {
  totalAppointments: number
  completedCount: number
  noShowCount: number
  cancelledCount: number
  noShowRate: number
  byDoctor: Array<{
    doctorName: string
    total: number
    completed: number
    noShows: number
  }>
  busiestHours: Array<{ hour: number; count: number }>
}

export interface StaffReport {
  byDoctor: Array<{
    doctorName: string
    activePatients: number
    admissions: number
    appointments: number
    records: number
  }>
}
