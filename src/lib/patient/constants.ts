import type { DocumentType } from '@/types/database'

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_DOCUMENT_MIMES = ['image/png', 'image/jpeg', 'application/pdf']
export const MAX_DOCUMENTS_PER_PATIENT = 20
export const PATIENT_DOCUMENTS_BUCKET = 'patient-documents'

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'INSURANCE_CARD', label: 'Insurance Card' },
  { value: 'ID_DOCUMENT', label: 'ID Document' },
  { value: 'REFERRAL_LETTER', label: 'Referral Letter' },
  { value: 'OTHER', label: 'Other' },
]
