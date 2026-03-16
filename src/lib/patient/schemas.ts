import { z } from 'zod'
import { MAX_DOCUMENT_SIZE, ALLOWED_DOCUMENT_MIMES } from './constants'
import type { DocumentType } from '@/types/database'

const DOCUMENT_TYPES: DocumentType[] = ['INSURANCE_CARD', 'ID_DOCUMENT', 'REFERRAL_LETTER', 'OTHER']

export const updateProfileSchema = z.object({
  phone: z.string().max(30).optional(),
  email: z.string().email('Enter a valid email').optional(),
  address: z.string().max(500).optional(),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(30).optional(),
})

export const requestAppointmentSchema = z.object({
  doctor_id: z.string().uuid('Select a doctor'),
  department_id: z.string().uuid().optional(),
  scheduled_at: z.string().min(1, 'Select a date and time'),
  duration_minutes: z.number().int().min(15).max(120).default(30),
  reason: z.string().max(500).optional(),
})

export const feedbackSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  admission_id: z.string().uuid().optional(),
  rating: z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  comment: z.string().max(1000).optional(),
}).refine(
  (data) => data.appointment_id || data.admission_id,
  { message: 'Select an appointment or admission to review' }
)

export const documentUploadSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPES as [DocumentType, ...DocumentType[]]),
  file_name: z.string().min(1).max(255),
  file_size: z.number().int().max(MAX_DOCUMENT_SIZE, 'File must be under 10MB'),
  mime_type: z.enum(ALLOWED_DOCUMENT_MIMES as [string, ...string[]], {
    error: 'Only PNG, JPEG, and PDF files are allowed',
  }),
})
