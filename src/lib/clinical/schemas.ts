import { z } from 'zod'

const ALLERGEN_TYPES = ['DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER'] as const
const ALLERGY_SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'] as const
const ALLERGY_STATUSES = ['ACTIVE', 'INACTIVE', 'RESOLVED'] as const
const DIAGNOSIS_STATUSES = ['ACTIVE', 'RESOLVED', 'CHRONIC', 'RULED_OUT'] as const

export const allergySchema = z.object({
  patient_id: z.string().uuid('Patient is required.'),
  allergen_name: z.string().min(1, 'Allergen name is required.').max(200),
  allergen_type: z.enum(ALLERGEN_TYPES),
  severity: z.enum(ALLERGY_SEVERITIES),
  reaction: z.string().max(500).optional(),
  status: z.enum(ALLERGY_STATUSES).optional(),
  onset_date: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export const updateAllergySchema = z.object({
  allergen_name: z.string().min(1, 'Allergen name is required.').max(200),
  allergen_type: z.enum(ALLERGEN_TYPES),
  severity: z.enum(ALLERGY_SEVERITIES),
  reaction: z.string().max(500).optional(),
  status: z.enum(ALLERGY_STATUSES),
  onset_date: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export const diagnosisSchema = z.object({
  patient_id: z.string().uuid('Patient is required.'),
  icd10_code: z.string().max(10).optional(),
  description: z.string().min(1, 'Description is required.').max(500),
  status: z.enum(DIAGNOSIS_STATUSES).optional(),
  diagnosed_date: z.string().min(1, 'Date is required.'),
  medical_record_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
})

export const updateDiagnosisSchema = z.object({
  icd10_code: z.string().max(10).optional(),
  description: z.string().min(1, 'Description is required.').max(500),
  status: z.enum(DIAGNOSIS_STATUSES),
  diagnosed_date: z.string().min(1, 'Date is required.'),
  resolved_date: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export const vitalSignsSchema = z.object({
  patient_id: z.string().uuid('Patient is required.'),
  admission_id: z.string().uuid().optional().or(z.literal('')),
  systolic_bp: z.coerce.number().int().min(50).max(300).optional().or(z.literal('')),
  diastolic_bp: z.coerce.number().int().min(20).max(200).optional().or(z.literal('')),
  heart_rate: z.coerce.number().int().min(20).max(300).optional().or(z.literal('')),
  temperature: z.coerce.number().min(30).max(45).optional().or(z.literal('')),
  respiratory_rate: z.coerce.number().int().min(5).max(60).optional().or(z.literal('')),
  o2_saturation: z.coerce.number().int().min(50).max(100).optional().or(z.literal('')),
  weight_kg: z.coerce.number().min(0.5).max(500).optional().or(z.literal('')),
  height_cm: z.coerce.number().min(20).max(300).optional().or(z.literal('')),
  pain_scale: z.coerce.number().int().min(0).max(10).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
})

export { ALLERGEN_TYPES, ALLERGY_SEVERITIES, ALLERGY_STATUSES, DIAGNOSIS_STATUSES }
