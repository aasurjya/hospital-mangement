import { canWriteRooms, canViewRooms, ROOM_MANAGEMENT_ROLES } from '../permissions'
import type { AppRole } from '@/types/database'

const ALL_ROLES: AppRole[] = [
  'PLATFORM_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST',
  'LAB_TECHNICIAN', 'PHARMACIST', 'BILLING_STAFF', 'ACCOUNTANT',
  'HR_MANAGER', 'OPERATIONS_MANAGER', 'PATIENT',
]

describe('canWriteRooms', () => {
  it('allows HOSPITAL_ADMIN', () => {
    expect(canWriteRooms('HOSPITAL_ADMIN')).toBe(true)
  })

  it('allows OPERATIONS_MANAGER', () => {
    expect(canWriteRooms('OPERATIONS_MANAGER')).toBe(true)
  })

  it.each([
    'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECHNICIAN',
    'PHARMACIST', 'BILLING_STAFF', 'ACCOUNTANT', 'HR_MANAGER', 'PATIENT',
  ] as AppRole[])('denies %s', (role) => {
    expect(canWriteRooms(role)).toBe(false)
  })

  it('does not include PLATFORM_ADMIN (handled by requireRoles auto-allow)', () => {
    expect(canWriteRooms('PLATFORM_ADMIN')).toBe(false)
  })
})

describe('canViewRooms', () => {
  it.each(
    ALL_ROLES.filter((r) => r !== 'PATIENT')
  )('allows %s', (role) => {
    expect(canViewRooms(role)).toBe(true)
  })

  it('denies PATIENT', () => {
    expect(canViewRooms('PATIENT')).toBe(false)
  })
})

describe('ROOM_MANAGEMENT_ROLES', () => {
  it('contains exactly HOSPITAL_ADMIN and OPERATIONS_MANAGER', () => {
    expect(ROOM_MANAGEMENT_ROLES).toEqual(
      expect.arrayContaining(['HOSPITAL_ADMIN', 'OPERATIONS_MANAGER'])
    )
    expect(ROOM_MANAGEMENT_ROLES).toHaveLength(2)
  })
})
