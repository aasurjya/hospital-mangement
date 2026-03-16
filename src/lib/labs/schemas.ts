import { z } from 'zod'

export const LAB_SAMPLE_TYPES = ['BLOOD', 'URINE', 'STOOL', 'CSF', 'SPUTUM', 'SWAB', 'TISSUE', 'OTHER'] as const
export const LAB_PRIORITIES = ['ROUTINE', 'URGENT', 'STAT'] as const
export const LAB_ORDER_STATUSES = ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const

export const labOrderSchema = z.object({
  patient_id: z.string().uuid('Patient is required.'),
  test_id: z.string().uuid().optional().or(z.literal('')),
  test_name: z.string().min(1, 'Test name is required.').max(200),
  priority: z.enum(LAB_PRIORITIES),
  clinical_notes: z.string().max(1000).optional(),
  admission_id: z.string().uuid().optional().or(z.literal('')),
})

export const labResultSchema = z.object({
  result_value: z.string().min(1, 'Result is required.').max(500),
  unit: z.string().max(50).optional(),
  normal_range: z.string().max(100).optional(),
  is_abnormal: z.string().optional(),
  interpretation: z.string().max(1000).optional(),
})

export const labCatalogueSchema = z.object({
  test_name: z.string().min(1, 'Test name is required.').max(200),
  test_code: z.string().max(20).optional(),
  category: z.string().max(100).optional(),
  sample_type: z.enum(LAB_SAMPLE_TYPES),
  normal_range: z.string().max(200).optional(),
  unit: z.string().max(50).optional(),
  turnaround_hours: z.coerce.number().int().min(1).optional().or(z.literal('')),
  price: z.coerce.number().min(0).optional().or(z.literal('')),
})
