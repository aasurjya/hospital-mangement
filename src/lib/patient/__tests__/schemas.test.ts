import { updateProfileSchema, requestAppointmentSchema, feedbackSchema, documentUploadSchema } from '../schemas'

describe('updateProfileSchema', () => {
  it('accepts valid input', () => {
    expect(updateProfileSchema.safeParse({ phone: '+1234567890', email: 'test@example.com' }).success).toBe(true)
  })

  it('accepts empty (all optional)', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(updateProfileSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('requestAppointmentSchema', () => {
  const validUUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

  it('accepts valid input', () => {
    const result = requestAppointmentSchema.safeParse({
      doctor_id: validUUID,
      scheduled_at: '2026-04-01T10:00',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing doctor_id', () => {
    const result = requestAppointmentSchema.safeParse({
      scheduled_at: '2026-04-01T10:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing scheduled_at', () => {
    const result = requestAppointmentSchema.safeParse({
      doctor_id: validUUID,
      scheduled_at: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional reason', () => {
    const result = requestAppointmentSchema.safeParse({
      doctor_id: validUUID,
      scheduled_at: '2026-04-01T10:00',
      reason: 'Annual checkup',
    })
    expect(result.success).toBe(true)
  })
})

describe('feedbackSchema', () => {
  const validUUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

  it('accepts valid with appointment_id', () => {
    expect(feedbackSchema.safeParse({ appointment_id: validUUID, rating: 5 }).success).toBe(true)
  })

  it('accepts valid with admission_id', () => {
    expect(feedbackSchema.safeParse({ admission_id: validUUID, rating: 3, comment: 'Good' }).success).toBe(true)
  })

  it('rejects without appointment or admission', () => {
    expect(feedbackSchema.safeParse({ rating: 4 }).success).toBe(false)
  })

  it('rejects rating below 1', () => {
    expect(feedbackSchema.safeParse({ appointment_id: validUUID, rating: 0 }).success).toBe(false)
  })

  it('rejects rating above 5', () => {
    expect(feedbackSchema.safeParse({ appointment_id: validUUID, rating: 6 }).success).toBe(false)
  })
})

describe('documentUploadSchema', () => {
  it('accepts valid input', () => {
    const result = documentUploadSchema.safeParse({
      document_type: 'INSURANCE_CARD',
      file_name: 'card.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
    })
    expect(result.success).toBe(true)
  })

  it('rejects oversized file', () => {
    const result = documentUploadSchema.safeParse({
      document_type: 'ID_DOCUMENT',
      file_name: 'large.pdf',
      file_size: 11 * 1024 * 1024,
      mime_type: 'application/pdf',
    })
    expect(result.success).toBe(false)
  })

  it('rejects disallowed MIME type', () => {
    const result = documentUploadSchema.safeParse({
      document_type: 'OTHER',
      file_name: 'doc.docx',
      file_size: 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid document type', () => {
    const result = documentUploadSchema.safeParse({
      document_type: 'INVALID',
      file_name: 'test.png',
      file_size: 1024,
      mime_type: 'image/png',
    })
    expect(result.success).toBe(false)
  })
})
