/**
 * Shared test data constants.
 * All credentials come from local Supabase seed data.
 * Staff credentials are created by the setup script at runtime.
 */

export const PLATFORM_ADMIN = {
  email: 'corp.asurjya@gmail.com',
  password: 'DevAdmin@2026!',
} as const

/** Filled in by global setup after creating the hospital + hospital admin */
export const HOSPITAL_ADMIN = {
  email: 'e2e-hospital-admin@test.local',
  password: 'E2eAdmin@2026!',
} as const

export const DOCTOR = {
  email: 'e2e-doctor@test.local',
  password: 'E2eDoctor@2026!',
} as const

export const NURSE = {
  email: 'e2e-nurse@test.local',
  password: 'E2eNurse@2026!',
} as const

export const BILLING_STAFF = {
  email: 'e2e-billing@test.local',
  password: 'E2eBilling@2026!',
} as const

export const RECEPTIONIST = {
  email: 'e2e-receptionist@test.local',
  password: 'E2eRecept@2026!',
} as const

export const TEST_HOSPITAL = {
  name: 'E2E Test Hospital',
  slug: 'e2e-test-hospital',
} as const

export const TEST_PATIENT = {
  full_name: 'Alice E2E Testpatient',
  date_of_birth: '1990-06-15',
  gender: 'FEMALE',
  phone: '+254700000001',
  email: 'alice.e2e@test.local',
} as const

export const TEST_DEPARTMENT = {
  name: 'E2E General Ward',
} as const

export const TEST_ROOM = {
  room_type: 'GENERAL',
  prefix: 'E2E-',
  quantity: '2',
  floor: '1',
} as const
