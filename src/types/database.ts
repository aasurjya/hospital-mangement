/**
 * Core application types derived from the database schema.
 * Keep these in sync with supabase/migrations.
 * Format matches Supabase CLI generated types (supabase gen types typescript).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole =
  | 'PLATFORM_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'LAB_TECHNICIAN'
  | 'PHARMACIST'
  | 'BILLING_STAFF'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'OPERATIONS_MANAGER'
  | 'PATIENT'

export type AuditEventType =
  | 'USER_CREATED'
  | 'USER_DEACTIVATED'
  | 'USER_REACTIVATED'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGED'
  | 'HOSPITAL_CREATED'
  | 'HOSPITAL_UPDATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_UPDATED'
  | 'ADMISSION_CREATED'
  | 'ADMISSION_DISCHARGED'
  | 'RECORD_CREATED'
  | 'RECORD_FINALIZED'
  | 'DEPARTMENT_CREATED'
  | 'DEPARTMENT_UPDATED'
  | 'ROOM_CREATED'
  | 'ROOM_UPDATED'
  | 'CONVERSATION_CREATED'
  | 'CONVERSATION_UPDATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MESSAGE_DELETED'
  | 'ATTACHMENT_UPLOADED'
  | 'INVOICE_CREATED'
  | 'INVOICE_ISSUED'
  | 'INVOICE_VOIDED'
  | 'PAYMENT_RECORDED'
  | 'FEEDBACK_CREATED'
  | 'APPOINTMENT_CANCELLED_BY_PATIENT'
  | 'DOCUMENT_UPLOADED'
  | 'PATIENT_PROFILE_UPDATED'
  | 'PATIENT_ACCOUNT_LINKED'
  | 'AI_SUGGESTION_CREATED'
  | 'AI_SUGGESTION_ACCEPTED'
  | 'AI_SUGGESTION_MODIFIED'
  | 'AI_SUGGESTION_REJECTED'

export type ConversationType = 'DIRECT' | 'GROUP' | 'BROADCAST'

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN'
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED'
export type RecordStatus = 'DRAFT' | 'FINALIZED'
export type RoomType = 'GENERAL' | 'PRIVATE' | 'SEMI_PRIVATE' | 'ICU' | 'NICU' | 'EMERGENCY' | 'OPERATION_THEATRE' | 'ISOLATION'
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'VOID'
export type PaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'INSURANCE' | 'OTHER'
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'CONSULTANT'
export type DocumentType = 'INSURANCE_CARD' | 'ID_DOCUMENT' | 'REFERRAL_LETTER' | 'OTHER'
export type AiSuggestionType = 'SOAP_NOTE' | 'DIFFERENTIAL_DIAGNOSIS' | 'DRUG_INTERACTION' | 'PATIENT_SUMMARY'
export type AiSuggestionStatus = 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED'

/** Supabase DB type map — matches CLI generated type format */
export type Database = {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string
          name: string
          slug: string
          address: string | null
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          address?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          hospital_id: string | null
          role: AppRole
          full_name: string
          display_name: string | null
          phone: string | null
          is_active: boolean
          specialty: string | null
          qualifications: string | null
          license_number: string | null
          license_expiry: string | null
          registration_number: string | null
          years_of_experience: number | null
          department_id: string | null
          employment_type: EmploymentType | null
          hire_date: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          hospital_id?: string | null
          role: AppRole
          full_name: string
          display_name?: string | null
          phone?: string | null
          is_active?: boolean
          specialty?: string | null
          qualifications?: string | null
          license_number?: string | null
          license_expiry?: string | null
          registration_number?: string | null
          years_of_experience?: number | null
          department_id?: string | null
          employment_type?: EmploymentType | null
          hire_date?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string | null
          role?: AppRole
          full_name?: string
          display_name?: string | null
          phone?: string | null
          is_active?: boolean
          specialty?: string | null
          qualifications?: string | null
          license_number?: string | null
          license_expiry?: string | null
          registration_number?: string | null
          years_of_experience?: number | null
          department_id?: string | null
          employment_type?: EmploymentType | null
          hire_date?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'user_profiles_department_id_fkey'; columns: ['department_id']; isOneToOne: false; referencedRelation: 'departments'; referencedColumns: ['id'] },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          hospital_id: string | null
          actor_id: string | null
          actor_role: AppRole | null
          subject_id: string | null
          event_type: AuditEventType
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          hospital_id?: string | null
          actor_id?: string | null
          actor_role?: AppRole | null
          subject_id?: string | null
          event_type: AuditEventType
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string | null
          actor_id?: string | null
          actor_role?: AppRole | null
          subject_id?: string | null
          event_type?: AuditEventType
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          hospital_id: string
          name: string
          description: string | null
          head_doctor_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          name: string
          description?: string | null
          head_doctor_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          name?: string
          description?: string | null
          head_doctor_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          hospital_id: string
          mrn: string
          full_name: string
          date_of_birth: string | null
          gender: PatientGender | null
          blood_type: BloodType | null
          phone: string | null
          email: string | null
          address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          insurance_provider: string | null
          insurance_number: string | null
          user_id: string | null
          allergies: string | null
          medical_notes: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          mrn: string
          full_name: string
          date_of_birth?: string | null
          gender?: PatientGender | null
          blood_type?: BloodType | null
          phone?: string | null
          email?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          user_id?: string | null
          allergies?: string | null
          medical_notes?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          mrn?: string
          full_name?: string
          date_of_birth?: string | null
          gender?: PatientGender | null
          blood_type?: BloodType | null
          phone?: string | null
          email?: string | null
          address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          insurance_provider?: string | null
          insurance_number?: string | null
          user_id?: string | null
          allergies?: string | null
          medical_notes?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'patients_user_id_fkey'; columns: ['user_id']; isOneToOne: true; referencedRelation: 'auth.users'; referencedColumns: ['id'] },
        ]
      }
      appointments: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          doctor_id: string | null
          department_id: string | null
          scheduled_at: string
          duration_minutes: number
          status: AppointmentStatus
          reason: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          doctor_id?: string | null
          department_id?: string | null
          scheduled_at: string
          duration_minutes?: number
          status?: AppointmentStatus
          reason?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          doctor_id?: string | null
          department_id?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: AppointmentStatus
          reason?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'appointments_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'appointments_doctor_id_fkey'; columns: ['doctor_id']; isOneToOne: false; referencedRelation: 'user_profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'appointments_department_id_fkey'; columns: ['department_id']; isOneToOne: false; referencedRelation: 'departments'; referencedColumns: ['id'] },
        ]
      }
      admissions: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          doctor_id: string | null
          department_id: string | null
          room_id: string | null
          admitted_at: string
          discharged_at: string | null
          status: AdmissionStatus
          reason: string | null
          notes: string | null
          bed_number: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          doctor_id?: string | null
          department_id?: string | null
          room_id?: string | null
          admitted_at?: string
          discharged_at?: string | null
          status?: AdmissionStatus
          reason?: string | null
          notes?: string | null
          bed_number?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          doctor_id?: string | null
          department_id?: string | null
          room_id?: string | null
          admitted_at?: string
          discharged_at?: string | null
          status?: AdmissionStatus
          reason?: string | null
          notes?: string | null
          bed_number?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'admissions_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'admissions_doctor_id_fkey'; columns: ['doctor_id']; isOneToOne: false; referencedRelation: 'user_profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'admissions_department_id_fkey'; columns: ['department_id']; isOneToOne: false; referencedRelation: 'departments'; referencedColumns: ['id'] },
          { foreignKeyName: 'admissions_room_id_fkey'; columns: ['room_id']; isOneToOne: false; referencedRelation: 'rooms'; referencedColumns: ['id'] },
        ]
      }
      rooms: {
        Row: {
          id: string
          hospital_id: string
          room_number: string
          room_type: RoomType
          floor: string | null
          is_available: boolean
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          room_number: string
          room_type?: RoomType
          floor?: string | null
          is_available?: boolean
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          room_number?: string
          room_type?: RoomType
          floor?: string | null
          is_available?: boolean
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'rooms_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      medical_records: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          author_id: string | null
          admission_id: string | null
          appointment_id: string | null
          visit_date: string
          chief_complaint: string | null
          notes: string | null
          status: RecordStatus
          finalized_by: string | null
          finalized_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          author_id?: string | null
          admission_id?: string | null
          appointment_id?: string | null
          visit_date?: string
          chief_complaint?: string | null
          notes?: string | null
          status?: RecordStatus
          finalized_by?: string | null
          finalized_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          author_id?: string | null
          admission_id?: string | null
          appointment_id?: string | null
          visit_date?: string
          chief_complaint?: string | null
          notes?: string | null
          status?: RecordStatus
          finalized_by?: string | null
          finalized_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'medical_records_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'medical_records_author_id_fkey'; columns: ['author_id']; isOneToOne: false; referencedRelation: 'user_profiles'; referencedColumns: ['id'] },
        ]
      }
      conversations: {
        Row: {
          id: string
          hospital_id: string
          type: ConversationType
          name: string | null
          description: string | null
          created_by: string | null
          allowed_roles: AppRole[] | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          type: ConversationType
          name?: string | null
          description?: string | null
          created_by?: string | null
          allowed_roles?: AppRole[] | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          type?: ConversationType
          name?: string | null
          description?: string | null
          created_by?: string | null
          allowed_roles?: AppRole[] | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'conversations_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'conversations_created_by_fkey'; columns: ['created_by']; isOneToOne: false; referencedRelation: 'user_profiles'; referencedColumns: ['id'] },
        ]
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          last_read_at: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          last_read_at?: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          last_read_at?: string
          joined_at?: string
        }
        Relationships: [
          { foreignKeyName: 'conversation_members_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] },
          { foreignKeyName: 'conversation_members_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'user_profiles'; referencedColumns: ['id'] },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          hospital_id: string
          content: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          hospital_id: string
          content?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          hospital_id?: string
          content?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'messages_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] },
          { foreignKeyName: 'messages_sender_id_fkey'; columns: ['sender_id']; isOneToOne: false; referencedRelation: 'user_profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'messages_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          hospital_id: string
          storage_path: string
          file_name: string
          file_size: number
          mime_type: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          hospital_id: string
          storage_path: string
          file_name: string
          file_size: number
          mime_type: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          hospital_id?: string
          storage_path?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'message_attachments_message_id_fkey'; columns: ['message_id']; isOneToOne: false; referencedRelation: 'messages'; referencedColumns: ['id'] },
          { foreignKeyName: 'message_attachments_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      invoices: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          admission_id: string | null
          appointment_id: string | null
          invoice_number: string
          status: InvoiceStatus
          issued_at: string | null
          due_date: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          amount_paid: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          admission_id?: string | null
          appointment_id?: string | null
          invoice_number: string
          status?: InvoiceStatus
          issued_at?: string | null
          due_date?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          amount_paid?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          admission_id?: string | null
          appointment_id?: string | null
          invoice_number?: string
          status?: InvoiceStatus
          issued_at?: string | null
          due_date?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          amount_paid?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'invoices_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'invoices_admission_id_fkey'; columns: ['admission_id']; isOneToOne: false; referencedRelation: 'admissions'; referencedColumns: ['id'] },
          { foreignKeyName: 'invoices_appointment_id_fkey'; columns: ['appointment_id']; isOneToOne: false; referencedRelation: 'appointments'; referencedColumns: ['id'] },
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          total: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total?: number
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'invoice_items_invoice_id_fkey'; columns: ['invoice_id']; isOneToOne: false; referencedRelation: 'invoices'; referencedColumns: ['id'] },
        ]
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          hospital_id: string
          amount: number
          method: PaymentMethod
          reference: string | null
          notes: string | null
          paid_at: string
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          hospital_id: string
          amount: number
          method?: PaymentMethod
          reference?: string | null
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          hospital_id?: string
          amount?: number
          method?: PaymentMethod
          reference?: string | null
          notes?: string | null
          paid_at?: string
          recorded_by?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'payments_invoice_id_fkey'; columns: ['invoice_id']; isOneToOne: false; referencedRelation: 'invoices'; referencedColumns: ['id'] },
          { foreignKeyName: 'payments_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      feedback: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          admission_id: string | null
          appointment_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          admission_id?: string | null
          appointment_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          admission_id?: string | null
          appointment_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'feedback_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'feedback_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
        ]
      }
      patient_documents: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          storage_path: string
          file_name: string
          file_size: number
          mime_type: string
          document_type: DocumentType
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          storage_path: string
          file_name: string
          file_size: number
          mime_type: string
          document_type?: DocumentType
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          storage_path?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          document_type?: DocumentType
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'patient_documents_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'patient_documents_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
        ]
      }
      ai_suggestions: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string | null
          doctor_id: string | null
          suggestion_type: AiSuggestionType
          input_text: string
          output_text: string
          model_used: string
          tokens_used: number
          status: AiSuggestionStatus
          modified_text: string | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id?: string | null
          doctor_id: string
          suggestion_type: AiSuggestionType
          input_text: string
          output_text: string
          model_used: string
          tokens_used?: number
          status?: AiSuggestionStatus
          modified_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string | null
          doctor_id?: string
          suggestion_type?: AiSuggestionType
          input_text?: string
          output_text?: string
          model_used?: string
          tokens_used?: number
          status?: AiSuggestionStatus
          modified_text?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'ai_suggestions_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'ai_suggestions_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_audit_log: {
        Args: {
          p_hospital_id: string | null
          p_actor_id: string
          p_actor_role: AppRole
          p_subject_id: string | null
          p_event_type: AuditEventType
          p_description: string
          p_metadata?: Json
        }
        Returns: string
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_hospital_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      my_patient_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      record_payment: {
        Args: {
          p_invoice_id: string
          p_hospital_id: string
          p_amount: number
          p_method: string
          p_reference?: string | null
          p_notes?: string | null
          p_recorded_by?: string | null
        }
        Returns: Json
      }
      get_unread_counts: {
        Args: {
          p_user_id: string
        }
        Returns: {
          conversation_id: string
          unread_count: number
        }[]
      }
    }
    Enums: {
      app_role: AppRole
      audit_event_type: AuditEventType
      patient_gender: PatientGender
      blood_type: BloodType
      appointment_status: AppointmentStatus
      admission_status: AdmissionStatus
      record_status: RecordStatus
      conversation_type: ConversationType
      room_type: RoomType
      invoice_status: InvoiceStatus
      payment_method: PaymentMethod
      employment_type: EmploymentType
      document_type: DocumentType
      ai_suggestion_type: AiSuggestionType
      ai_suggestion_status: AiSuggestionStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/** Convenience row types */
export type Hospital = Database['public']['Tables']['hospitals']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Admission = Database['public']['Tables']['admissions']['Row']
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationMember = Database['public']['Tables']['conversation_members']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageAttachment = Database['public']['Tables']['message_attachments']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type PatientDocument = Database['public']['Tables']['patient_documents']['Row']
export type AiSuggestion = Database['public']['Tables']['ai_suggestions']['Row']
