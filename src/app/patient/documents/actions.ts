'use server'

import { revalidatePath } from 'next/cache'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { documentUploadSchema } from '@/lib/patient/schemas'
import { PATIENT_DOCUMENTS_BUCKET, MAX_DOCUMENTS_PER_PATIENT } from '@/lib/patient/constants'
import type { DocumentType } from '@/types/database'

export type DocumentActionState = { status: 'success' } | { status: 'error'; error: string } | null

export async function uploadDocumentAction(
  _prev: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { status: 'error', error: 'Please select a file.' }

  const parsed = documentUploadSchema.safeParse({
    document_type: formData.get('document_type'),
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  })

  // Enforce document count limit
  const supabase = createSupabaseServiceClient()
  const { count: existingCount } = await supabase
    .from('patient_documents')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)

  if ((existingCount ?? 0) >= MAX_DOCUMENTS_PER_PATIENT) {
    return { status: 'error', error: `Maximum ${MAX_DOCUMENTS_PER_PATIENT} documents allowed.` }
  }

  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid file.' }
  }

  const storagePath = `${hospitalId}/${ctx.patientId}/${crypto.randomUUID()}-${parsed.data.file_name}`

  const { error: uploadError } = await supabase.storage
    .from(PATIENT_DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: parsed.data.mime_type })

  if (uploadError) return { status: 'error', error: 'Failed to upload file. Please try again.' }

  const { error: dbError } = await supabase.from('patient_documents').insert({
    hospital_id: hospitalId,
    patient_id: ctx.patientId,
    storage_path: storagePath,
    file_name: parsed.data.file_name,
    file_size: parsed.data.file_size,
    mime_type: parsed.data.mime_type,
    document_type: parsed.data.document_type as DocumentType,
    uploaded_by: ctx.userId,
  })

  if (dbError) {
    await supabase.storage.from(PATIENT_DOCUMENTS_BUCKET).remove([storagePath])
    return { status: 'error', error: 'Failed to save document record.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: ctx.patientId,
    eventType: 'DOCUMENT_UPLOADED',
    description: `Patient uploaded document "${parsed.data.file_name}"`,
    metadata: { patientId: ctx.patientId, fileName: parsed.data.file_name, documentType: parsed.data.document_type },
  })

  revalidatePath('/patient/documents')
  return { status: 'success' }
}

export async function deleteDocumentAction(documentId: string): Promise<DocumentActionState> {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = createSupabaseServiceClient()

  const { data: doc } = await supabase
    .from('patient_documents')
    .select('id, storage_path')
    .eq('id', documentId)
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!doc) return { status: 'error', error: 'Document not found.' }

  const { error: dbError } = await supabase
    .from('patient_documents')
    .delete()
    .eq('id', documentId)

  if (dbError) return { status: 'error', error: 'Failed to delete document record.' }

  // Best-effort storage cleanup (DB record is already gone)
  await supabase.storage.from(PATIENT_DOCUMENTS_BUCKET).remove([doc.storage_path])

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: ctx.patientId,
    eventType: 'DOCUMENT_UPLOADED', // reuse closest event type
    description: `Patient deleted document "${doc.storage_path.split('/').pop()}"`,
    metadata: { patientId: ctx.patientId, documentId },
  })

  revalidatePath('/patient/documents')
  return { status: 'success' }
}
