import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { card, btn } from '@/lib/styles'
import { UploadDocumentForm } from './upload-form'
import { DeleteDocumentButton } from './delete-button'

export const metadata = { title: 'My Documents' }

export default async function PatientDocumentsPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: documents } = await supabase
    .from('patient_documents')
    .select('id, file_name, file_size, document_type, mime_type, created_at')
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">My Documents</h1>

      <div className="mb-6">
        <UploadDocumentForm />
      </div>

      {!documents || documents.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className={`${card.base} flex items-center justify-between`}>
              <div>
                <p className="text-sm font-medium text-neutral-900">{doc.file_name}</p>
                <p className="text-xs text-neutral-500">
                  {formatLabel(doc.document_type)} &middot; {formatFileSize(doc.file_size)} &middot; {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <DeleteDocumentButton documentId={doc.id} fileName={doc.file_name} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
