import { soapInputSchema, diagnosisInputSchema, drugInteractionInputSchema, patientSummaryInputSchema, resolveSuggestionSchema } from '../schemas'

const validUUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

describe('soapInputSchema', () => {
  it('accepts valid input', () => {
    expect(soapInputSchema.safeParse({ patient_id: validUUID, observations: 'Patient presents with chest pain for 2 days' }).success).toBe(true)
  })

  it('rejects short observations', () => {
    expect(soapInputSchema.safeParse({ patient_id: validUUID, observations: 'short' }).success).toBe(false)
  })

  it('rejects missing patient_id', () => {
    expect(soapInputSchema.safeParse({ observations: 'Patient presents with chest pain' }).success).toBe(false)
  })
})

describe('diagnosisInputSchema', () => {
  it('accepts valid input', () => {
    expect(diagnosisInputSchema.safeParse({ patient_id: validUUID, symptoms: 'Fever, cough, shortness of breath for 3 days' }).success).toBe(true)
  })

  it('rejects short symptoms', () => {
    expect(diagnosisInputSchema.safeParse({ patient_id: validUUID, symptoms: 'pain' }).success).toBe(false)
  })
})

describe('drugInteractionInputSchema', () => {
  it('accepts valid input with 2 medications', () => {
    expect(drugInteractionInputSchema.safeParse({ medications: ['Aspirin', 'Warfarin'] }).success).toBe(true)
  })

  it('accepts with optional patient_id', () => {
    expect(drugInteractionInputSchema.safeParse({ patient_id: validUUID, medications: ['Metformin', 'Lisinopril'] }).success).toBe(true)
  })

  it('rejects less than 2 medications', () => {
    expect(drugInteractionInputSchema.safeParse({ medications: ['Aspirin'] }).success).toBe(false)
  })

  it('rejects more than 20 medications', () => {
    const meds = Array.from({ length: 21 }, (_, i) => `Drug${i}`)
    expect(drugInteractionInputSchema.safeParse({ medications: meds }).success).toBe(false)
  })

  it('rejects empty medication names', () => {
    expect(drugInteractionInputSchema.safeParse({ medications: ['', ''] }).success).toBe(false)
  })
})

describe('patientSummaryInputSchema', () => {
  it('accepts valid UUID', () => {
    expect(patientSummaryInputSchema.safeParse({ patient_id: validUUID }).success).toBe(true)
  })

  it('rejects invalid UUID', () => {
    expect(patientSummaryInputSchema.safeParse({ patient_id: 'not-a-uuid' }).success).toBe(false)
  })
})

describe('resolveSuggestionSchema', () => {
  it('accepts ACCEPTED without modified_text', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'ACCEPTED' }).success).toBe(true)
  })

  it('accepts REJECTED without modified_text', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'REJECTED' }).success).toBe(true)
  })

  it('accepts MODIFIED with modified_text', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'MODIFIED', modified_text: 'Updated content' }).success).toBe(true)
  })

  it('rejects MODIFIED without modified_text', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'MODIFIED' }).success).toBe(false)
  })

  it('rejects MODIFIED with empty modified_text', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'MODIFIED', modified_text: '' }).success).toBe(false)
  })

  it('rejects invalid action', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'INVALID' }).success).toBe(false)
  })

  it('rejects PENDING as action', () => {
    expect(resolveSuggestionSchema.safeParse({ suggestion_id: validUUID, action: 'PENDING' }).success).toBe(false)
  })
})
