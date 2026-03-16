import { canViewReports, REPORT_ACCESS_ROLES } from '../permissions'
import type { AppRole } from '@/types/database'

describe('canViewReports', () => {
  it('allows HOSPITAL_ADMIN', () => {
    expect(canViewReports('HOSPITAL_ADMIN')).toBe(true)
  })

  it('allows OPERATIONS_MANAGER', () => {
    expect(canViewReports('OPERATIONS_MANAGER')).toBe(true)
  })

  it.each([
    'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECHNICIAN',
    'PHARMACIST', 'BILLING_STAFF', 'ACCOUNTANT', 'HR_MANAGER', 'PATIENT',
  ] as AppRole[])('denies %s', (role) => {
    expect(canViewReports(role)).toBe(false)
  })

  it('does not include PLATFORM_ADMIN (handled by requireRoles auto-allow)', () => {
    expect(canViewReports('PLATFORM_ADMIN')).toBe(false)
  })
})

describe('REPORT_ACCESS_ROLES', () => {
  it('contains exactly HOSPITAL_ADMIN and OPERATIONS_MANAGER', () => {
    expect(REPORT_ACCESS_ROLES).toEqual(
      expect.arrayContaining(['HOSPITAL_ADMIN', 'OPERATIONS_MANAGER'])
    )
    expect(REPORT_ACCESS_ROLES).toHaveLength(2)
  })
})
