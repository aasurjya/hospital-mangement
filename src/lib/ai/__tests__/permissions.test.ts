import { canUseAiAssistant, AI_ASSISTANT_ROLES } from '../permissions'
import type { AppRole } from '@/types/database'

describe('canUseAiAssistant', () => {
  it('allows DOCTOR', () => {
    expect(canUseAiAssistant('DOCTOR')).toBe(true)
  })

  it.each([
    'PLATFORM_ADMIN', 'HOSPITAL_ADMIN', 'NURSE', 'RECEPTIONIST',
    'LAB_TECHNICIAN', 'PHARMACIST', 'BILLING_STAFF', 'ACCOUNTANT',
    'HR_MANAGER', 'OPERATIONS_MANAGER', 'PATIENT',
  ] as AppRole[])('denies %s', (role) => {
    expect(canUseAiAssistant(role)).toBe(false)
  })
})

describe('AI_ASSISTANT_ROLES', () => {
  it('contains only DOCTOR', () => {
    expect(AI_ASSISTANT_ROLES).toEqual(['DOCTOR'])
  })
})
