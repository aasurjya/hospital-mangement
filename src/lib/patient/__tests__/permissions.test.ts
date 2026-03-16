import { canCancelAppointment, canSubmitFeedback, isEditableContactField } from '../permissions'

describe('canCancelAppointment', () => {
  it('allows SCHEDULED', () => {
    expect(canCancelAppointment('SCHEDULED')).toBe(true)
  })

  it.each(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)(
    'denies %s', (status) => {
      expect(canCancelAppointment(status)).toBe(false)
    }
  )
})

describe('canSubmitFeedback', () => {
  it('allows COMPLETED appointment', () => {
    expect(canSubmitFeedback('COMPLETED', null)).toBe(true)
  })

  it('allows DISCHARGED admission', () => {
    expect(canSubmitFeedback(null, 'DISCHARGED')).toBe(true)
  })

  it('denies SCHEDULED appointment', () => {
    expect(canSubmitFeedback('SCHEDULED', null)).toBe(false)
  })

  it('denies ADMITTED admission', () => {
    expect(canSubmitFeedback(null, 'ADMITTED')).toBe(false)
  })

  it('denies both null', () => {
    expect(canSubmitFeedback(null, null)).toBe(false)
  })
})

describe('isEditableContactField', () => {
  it.each(['phone', 'email', 'address', 'emergency_contact_name', 'emergency_contact_phone'])(
    'allows %s', (field) => {
      expect(isEditableContactField(field)).toBe(true)
    }
  )

  it.each(['full_name', 'mrn', 'date_of_birth', 'gender', 'blood_type', 'allergies', 'medical_notes'])(
    'denies %s', (field) => {
      expect(isEditableContactField(field)).toBe(false)
    }
  )
})
