import { z } from 'zod'

export const DRUG_FORMS = ['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'TOPICAL', 'INHALER', 'DROPS', 'SUPPOSITORY', 'PATCH', 'OTHER'] as const
export const DRUG_CATEGORIES = ['ANTIBIOTIC', 'ANALGESIC', 'ANTIHYPERTENSIVE', 'ANTIDIABETIC', 'ANTICOAGULANT', 'ANTIDEPRESSANT', 'ANTIPSYCHOTIC', 'CARDIOVASCULAR', 'RESPIRATORY', 'GASTROINTESTINAL', 'ENDOCRINE', 'IMMUNOSUPPRESSANT', 'VITAMIN', 'OTHER'] as const
export const MEDICATION_ROUTES = ['ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALATION', 'RECTAL', 'SUBLINGUAL', 'TRANSDERMAL', 'OTHER'] as const
export const PRESCRIPTION_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISCONTINUED'] as const

export const formularySchema = z.object({
  generic_name: z.string().min(1, 'Generic name is required.').max(200),
  brand_name: z.string().max(200).optional(),
  form: z.enum(DRUG_FORMS),
  strength: z.string().max(100).optional(),
  category: z.enum(DRUG_CATEGORIES),
  notes: z.string().max(1000).optional(),
})

export const prescriptionSchema = z.object({
  patient_id: z.string().uuid('Patient is required.'),
  drug_id: z.string().uuid().optional().or(z.literal('')),
  drug_name: z.string().min(1, 'Drug name is required.').max(200),
  dosage: z.string().min(1, 'Dosage is required.').max(100),
  route: z.enum(MEDICATION_ROUTES),
  frequency: z.string().min(1, 'Frequency is required.').max(100),
  duration: z.string().max(100).optional(),
  quantity: z.coerce.number().int().min(1).optional().or(z.literal('')),
  refills: z.coerce.number().int().min(0).max(12).optional().or(z.literal('')),
  allergy_override: z.string().optional(),
  allergy_override_reason: z.string().max(500).optional(),
  admission_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
})
