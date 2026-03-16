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
  // Phase 9: Clinical Foundation
  | 'ALLERGY_CREATED'
  | 'ALLERGY_UPDATED'
  | 'ALLERGY_DELETED'
  | 'DIAGNOSIS_CREATED'
  | 'DIAGNOSIS_UPDATED'
  | 'VITAL_SIGNS_RECORDED'
  // Phase 10: Prescriptions & Medications
  | 'FORMULARY_CREATED'
  | 'FORMULARY_UPDATED'
  | 'PRESCRIPTION_CREATED'
  | 'PRESCRIPTION_UPDATED'
  | 'MEDICATION_DISPENSED'
  | 'MEDICATION_ADMINISTERED'
  // Phase 11: Lab Orders & Results
  | 'LAB_ORDER_CREATED'
  | 'LAB_ORDER_UPDATED'
  | 'LAB_RESULT_ENTERED'
  | 'LAB_RESULT_VERIFIED'
  | 'LAB_CATALOGUE_CREATED'
  // Phase 12: Discharge Summaries
  | 'DISCHARGE_SUMMARY_CREATED'
  | 'DISCHARGE_SUMMARY_FINALIZED'
  // Phase 13: Notifications
  | 'NOTIFICATION_TEMPLATE_CREATED'
  | 'NOTIFICATION_TEMPLATE_UPDATED'
  | 'NOTIFICATION_SENT'
  // Phase 14: Scheduling & OPD
  | 'SHIFT_CREATED'
  | 'SHIFT_UPDATED'
  | 'SWAP_REQUESTED'
  | 'SWAP_REVIEWED'
  | 'OPD_CHECK_IN'
  | 'OPD_STATUS_UPDATED'
  // Phase 15: OR & Inventory
  | 'OR_CASE_CREATED'
  | 'OR_CASE_UPDATED'
  | 'INVENTORY_ITEM_CREATED'
  | 'INVENTORY_TRANSACTION'
  // Phase 16: Beds
  | 'BED_ASSIGNED'
  | 'BED_RELEASED'

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

// Phase 9: Clinical Foundation
export type AllergenType = 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER'
// Phase 10: Prescriptions & Medications
export type DrugForm = 'TABLET' | 'CAPSULE' | 'LIQUID' | 'INJECTION' | 'TOPICAL' | 'INHALER' | 'DROPS' | 'SUPPOSITORY' | 'PATCH' | 'OTHER'
export type DrugCategory = 'ANTIBIOTIC' | 'ANALGESIC' | 'ANTIHYPERTENSIVE' | 'ANTIDIABETIC' | 'ANTICOAGULANT' | 'ANTIDEPRESSANT' | 'ANTIPSYCHOTIC' | 'CARDIOVASCULAR' | 'RESPIRATORY' | 'GASTROINTESTINAL' | 'ENDOCRINE' | 'IMMUNOSUPPRESSANT' | 'VITAMIN' | 'OTHER'
export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISCONTINUED'
export type MedicationOrderStatus = 'ORDERED' | 'DISPENSED' | 'ADMINISTERED' | 'CANCELLED'
export type MedicationRoute = 'ORAL' | 'IV' | 'IM' | 'SC' | 'TOPICAL' | 'INHALATION' | 'RECTAL' | 'SUBLINGUAL' | 'TRANSDERMAL' | 'OTHER'
// Phase 11: Lab Orders & Results
export type LabSampleType = 'BLOOD' | 'URINE' | 'STOOL' | 'CSF' | 'SPUTUM' | 'SWAB' | 'TISSUE' | 'OTHER'
export type LabOrderPriority = 'ROUTINE' | 'URGENT' | 'STAT'
export type LabOrderStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
// Phase 12: Discharge Summaries
export type DischargeSummaryStatus = 'DRAFT' | 'FINALIZED'
// Phase 13: Notifications
export type NotificationChannel = 'EMAIL' | 'SMS'
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED'
// Phase 14: Scheduling & OPD
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ON_CALL'
export type SwapRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TriageLevel = 'EMERGENCY' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT'
export type OpdStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'
// Phase 15: OR & Inventory
export type OrCaseStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type AnesthesiaType = 'GENERAL' | 'LOCAL' | 'REGIONAL' | 'SPINAL' | 'EPIDURAL' | 'SEDATION' | 'NONE'
export type InventoryTransactionType = 'PURCHASE' | 'DISPENSED' | 'ADJUSTMENT' | 'EXPIRED' | 'RETURNED'
export type InventoryAlertType = 'LOW_STOCK' | 'EXPIRED' | 'EXPIRING_SOON'
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
export type AllergyStatus = 'ACTIVE' | 'INACTIVE' | 'RESOLVED'
export type DiagnosisStatus = 'ACTIVE' | 'RESOLVED' | 'CHRONIC' | 'RULED_OUT'

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
          bed_id: string | null
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
          bed_id?: string | null
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
          bed_id?: string | null
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
      patient_allergies: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          allergen_name: string
          allergen_type: AllergenType
          severity: AllergySeverity
          reaction: string | null
          status: AllergyStatus
          onset_date: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          allergen_name: string
          allergen_type?: AllergenType
          severity?: AllergySeverity
          reaction?: string | null
          status?: AllergyStatus
          onset_date?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          allergen_name?: string
          allergen_type?: AllergenType
          severity?: AllergySeverity
          reaction?: string | null
          status?: AllergyStatus
          onset_date?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'patient_allergies_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'patient_allergies_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      patient_diagnoses: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          medical_record_id: string | null
          icd10_code: string | null
          description: string
          status: DiagnosisStatus
          diagnosed_date: string
          resolved_date: string | null
          notes: string | null
          diagnosed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          medical_record_id?: string | null
          icd10_code?: string | null
          description: string
          status?: DiagnosisStatus
          diagnosed_date?: string
          resolved_date?: string | null
          notes?: string | null
          diagnosed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          medical_record_id?: string | null
          icd10_code?: string | null
          description?: string
          status?: DiagnosisStatus
          diagnosed_date?: string
          resolved_date?: string | null
          notes?: string | null
          diagnosed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'patient_diagnoses_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'patient_diagnoses_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'patient_diagnoses_medical_record_id_fkey'; columns: ['medical_record_id']; isOneToOne: false; referencedRelation: 'medical_records'; referencedColumns: ['id'] },
        ]
      }
      vital_signs: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          admission_id: string | null
          systolic_bp: number | null
          diastolic_bp: number | null
          heart_rate: number | null
          temperature: number | null
          respiratory_rate: number | null
          o2_saturation: number | null
          weight_kg: number | null
          height_cm: number | null
          bmi: number | null
          pain_scale: number | null
          notes: string | null
          recorded_by: string | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          admission_id?: string | null
          systolic_bp?: number | null
          diastolic_bp?: number | null
          heart_rate?: number | null
          temperature?: number | null
          respiratory_rate?: number | null
          o2_saturation?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          bmi?: number | null
          pain_scale?: number | null
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          admission_id?: string | null
          systolic_bp?: number | null
          diastolic_bp?: number | null
          heart_rate?: number | null
          temperature?: number | null
          respiratory_rate?: number | null
          o2_saturation?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          bmi?: number | null
          pain_scale?: number | null
          notes?: string | null
          recorded_by?: string | null
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'vital_signs_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'vital_signs_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'vital_signs_admission_id_fkey'; columns: ['admission_id']; isOneToOne: false; referencedRelation: 'admissions'; referencedColumns: ['id'] },
        ]
      }
      drug_formulary: {
        Row: {
          id: string
          hospital_id: string
          generic_name: string
          brand_name: string | null
          form: DrugForm
          strength: string | null
          category: DrugCategory
          is_active: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          generic_name: string
          brand_name?: string | null
          form?: DrugForm
          strength?: string | null
          category?: DrugCategory
          is_active?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          generic_name?: string
          brand_name?: string | null
          form?: DrugForm
          strength?: string | null
          category?: DrugCategory
          is_active?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'drug_formulary_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      prescriptions: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          drug_id: string | null
          drug_name: string
          dosage: string
          route: MedicationRoute
          frequency: string
          duration: string | null
          quantity: number | null
          refills: number
          status: PrescriptionStatus
          allergy_override: boolean
          allergy_override_reason: string | null
          notes: string | null
          prescribed_by: string
          admission_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          drug_id?: string | null
          drug_name: string
          dosage: string
          route?: MedicationRoute
          frequency: string
          duration?: string | null
          quantity?: number | null
          refills?: number
          status?: PrescriptionStatus
          allergy_override?: boolean
          allergy_override_reason?: string | null
          notes?: string | null
          prescribed_by: string
          admission_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          drug_id?: string | null
          drug_name?: string
          dosage?: string
          route?: MedicationRoute
          frequency?: string
          duration?: string | null
          quantity?: number | null
          refills?: number
          status?: PrescriptionStatus
          allergy_override?: boolean
          allergy_override_reason?: string | null
          notes?: string | null
          prescribed_by?: string
          admission_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'prescriptions_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'prescriptions_drug_id_fkey'; columns: ['drug_id']; isOneToOne: false; referencedRelation: 'drug_formulary'; referencedColumns: ['id'] },
          { foreignKeyName: 'prescriptions_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      medication_orders: {
        Row: {
          id: string
          hospital_id: string
          prescription_id: string
          patient_id: string
          status: MedicationOrderStatus
          ordered_by: string | null
          dispensed_by: string | null
          dispensed_at: string | null
          administered_by: string | null
          administered_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          prescription_id: string
          patient_id: string
          status?: MedicationOrderStatus
          ordered_by?: string | null
          dispensed_by?: string | null
          dispensed_at?: string | null
          administered_by?: string | null
          administered_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          prescription_id?: string
          patient_id?: string
          status?: MedicationOrderStatus
          ordered_by?: string | null
          dispensed_by?: string | null
          dispensed_at?: string | null
          administered_by?: string | null
          administered_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'medication_orders_prescription_id_fkey'; columns: ['prescription_id']; isOneToOne: false; referencedRelation: 'prescriptions'; referencedColumns: ['id'] },
          { foreignKeyName: 'medication_orders_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'medication_orders_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      lab_test_catalogue: {
        Row: {
          id: string
          hospital_id: string
          test_name: string
          test_code: string | null
          category: string | null
          sample_type: LabSampleType
          normal_range: string | null
          unit: string | null
          turnaround_hours: number | null
          price: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          test_name: string
          test_code?: string | null
          category?: string | null
          sample_type?: LabSampleType
          normal_range?: string | null
          unit?: string | null
          turnaround_hours?: number | null
          price?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          test_name?: string
          test_code?: string | null
          category?: string | null
          sample_type?: LabSampleType
          normal_range?: string | null
          unit?: string | null
          turnaround_hours?: number | null
          price?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'lab_test_catalogue_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      lab_orders: {
        Row: {
          id: string
          hospital_id: string
          patient_id: string
          order_number: string
          test_id: string | null
          test_name: string
          priority: LabOrderPriority
          status: LabOrderStatus
          clinical_notes: string | null
          ordered_by: string
          collected_by: string | null
          collected_at: string | null
          completed_at: string | null
          admission_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          patient_id: string
          order_number: string
          test_id?: string | null
          test_name: string
          priority?: LabOrderPriority
          status?: LabOrderStatus
          clinical_notes?: string | null
          ordered_by: string
          collected_by?: string | null
          collected_at?: string | null
          completed_at?: string | null
          admission_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          patient_id?: string
          order_number?: string
          test_id?: string | null
          test_name?: string
          priority?: LabOrderPriority
          status?: LabOrderStatus
          clinical_notes?: string | null
          ordered_by?: string
          collected_by?: string | null
          collected_at?: string | null
          completed_at?: string | null
          admission_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'lab_orders_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'lab_orders_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'lab_orders_test_id_fkey'; columns: ['test_id']; isOneToOne: false; referencedRelation: 'lab_test_catalogue'; referencedColumns: ['id'] },
        ]
      }
      lab_results: {
        Row: {
          id: string
          hospital_id: string
          lab_order_id: string
          result_value: string
          unit: string | null
          normal_range: string | null
          is_abnormal: boolean
          interpretation: string | null
          entered_by: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hospital_id: string
          lab_order_id: string
          result_value: string
          unit?: string | null
          normal_range?: string | null
          is_abnormal?: boolean
          interpretation?: string | null
          entered_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hospital_id?: string
          lab_order_id?: string
          result_value?: string
          unit?: string | null
          normal_range?: string | null
          is_abnormal?: boolean
          interpretation?: string | null
          entered_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'lab_results_lab_order_id_fkey'; columns: ['lab_order_id']; isOneToOne: false; referencedRelation: 'lab_orders'; referencedColumns: ['id'] },
          { foreignKeyName: 'lab_results_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      discharge_summaries: {
        Row: {
          id: string; hospital_id: string; admission_id: string; patient_id: string
          admission_diagnosis: string | null; discharge_diagnosis: string | null
          summary_of_stay: string | null; procedures: string | null
          discharge_medications_json: Json; follow_up_instructions: string | null
          follow_up_date: string | null; status: DischargeSummaryStatus
          created_by: string | null; finalized_by: string | null; finalized_at: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; hospital_id: string; admission_id: string; patient_id: string
          admission_diagnosis?: string | null; discharge_diagnosis?: string | null
          summary_of_stay?: string | null; procedures?: string | null
          discharge_medications_json?: Json; follow_up_instructions?: string | null
          follow_up_date?: string | null; status?: DischargeSummaryStatus
          created_by?: string | null; finalized_by?: string | null; finalized_at?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; admission_id?: string; patient_id?: string
          admission_diagnosis?: string | null; discharge_diagnosis?: string | null
          summary_of_stay?: string | null; procedures?: string | null
          discharge_medications_json?: Json; follow_up_instructions?: string | null
          follow_up_date?: string | null; status?: DischargeSummaryStatus
          created_by?: string | null; finalized_by?: string | null; finalized_at?: string | null
          created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'discharge_summaries_admission_id_fkey'; columns: ['admission_id']; isOneToOne: true; referencedRelation: 'admissions'; referencedColumns: ['id'] },
          { foreignKeyName: 'discharge_summaries_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
        ]
      }
      notification_templates: {
        Row: {
          id: string; hospital_id: string; event_key: string; channel: NotificationChannel
          subject: string | null; body_template: string; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; hospital_id: string; event_key: string; channel?: NotificationChannel
          subject?: string | null; body_template: string; is_active?: boolean
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; event_key?: string; channel?: NotificationChannel
          subject?: string | null; body_template?: string; is_active?: boolean
          created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'notification_templates_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      notification_log: {
        Row: {
          id: string; hospital_id: string; template_id: string | null
          recipient_email: string | null; recipient_phone: string | null
          channel: NotificationChannel; subject: string | null; body: string
          status: NotificationStatus; error_message: string | null
          related_entity_type: string | null; related_entity_id: string | null
          sent_at: string | null; created_at: string
        }
        Insert: {
          id?: string; hospital_id: string; template_id?: string | null
          recipient_email?: string | null; recipient_phone?: string | null
          channel: NotificationChannel; subject?: string | null; body: string
          status?: NotificationStatus; error_message?: string | null
          related_entity_type?: string | null; related_entity_id?: string | null
          sent_at?: string | null; created_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; template_id?: string | null
          recipient_email?: string | null; recipient_phone?: string | null
          channel?: NotificationChannel; subject?: string | null; body?: string
          status?: NotificationStatus; error_message?: string | null
          related_entity_type?: string | null; related_entity_id?: string | null
          sent_at?: string | null; created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'notification_log_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      shift_schedules: {
        Row: {
          id: string; hospital_id: string; staff_id: string; department_id: string | null
          shift_type: ShiftType; shift_date: string; start_time: string; end_time: string
          notes: string | null; created_by: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; hospital_id: string; staff_id: string; department_id?: string | null
          shift_type: ShiftType; shift_date: string; start_time: string; end_time: string
          notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; staff_id?: string; department_id?: string | null
          shift_type?: ShiftType; shift_date?: string; start_time?: string; end_time?: string
          notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'shift_schedules_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'shift_schedules_department_id_fkey'; columns: ['department_id']; isOneToOne: false; referencedRelation: 'departments'; referencedColumns: ['id'] },
        ]
      }
      shift_swap_requests: {
        Row: {
          id: string; hospital_id: string; requester_shift_id: string; target_staff_id: string
          status: SwapRequestStatus; reason: string | null; reviewed_by: string | null
          reviewed_at: string | null; created_at: string
        }
        Insert: {
          id?: string; hospital_id: string; requester_shift_id: string; target_staff_id: string
          status?: SwapRequestStatus; reason?: string | null; reviewed_by?: string | null
          reviewed_at?: string | null; created_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; requester_shift_id?: string; target_staff_id?: string
          status?: SwapRequestStatus; reason?: string | null; reviewed_by?: string | null
          reviewed_at?: string | null; created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'shift_swap_requests_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'shift_swap_requests_requester_shift_id_fkey'; columns: ['requester_shift_id']; isOneToOne: false; referencedRelation: 'shift_schedules'; referencedColumns: ['id'] },
        ]
      }
      opd_queue: {
        Row: {
          id: string; hospital_id: string; patient_id: string; department_id: string | null
          doctor_id: string | null; token_number: number; triage_level: TriageLevel
          status: OpdStatus; vital_signs_id: string | null; chief_complaint: string | null
          checked_in_by: string | null; checked_in_at: string
          consultation_started_at: string | null; completed_at: string | null; created_at: string
        }
        Insert: {
          id?: string; hospital_id: string; patient_id: string; department_id?: string | null
          doctor_id?: string | null; token_number: number; triage_level?: TriageLevel
          status?: OpdStatus; vital_signs_id?: string | null; chief_complaint?: string | null
          checked_in_by?: string | null; checked_in_at?: string
          consultation_started_at?: string | null; completed_at?: string | null; created_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; patient_id?: string; department_id?: string | null
          doctor_id?: string | null; token_number?: number; triage_level?: TriageLevel
          status?: OpdStatus; vital_signs_id?: string | null; chief_complaint?: string | null
          checked_in_by?: string | null; checked_in_at?: string
          consultation_started_at?: string | null; completed_at?: string | null; created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'opd_queue_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'opd_queue_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      or_cases: {
        Row: {
          id: string; hospital_id: string; patient_id: string; room_id: string | null
          primary_surgeon_id: string; procedure_name: string; procedure_code: string | null
          scheduled_start: string; scheduled_end: string; actual_start: string | null; actual_end: string | null
          status: OrCaseStatus; anesthesia_type: AnesthesiaType
          pre_op_notes: string | null; post_op_notes: string | null
          created_by: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; hospital_id: string; patient_id: string; room_id?: string | null
          primary_surgeon_id: string; procedure_name: string; procedure_code?: string | null
          scheduled_start: string; scheduled_end: string; actual_start?: string | null; actual_end?: string | null
          status?: OrCaseStatus; anesthesia_type?: AnesthesiaType
          pre_op_notes?: string | null; post_op_notes?: string | null
          created_by?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; patient_id?: string; room_id?: string | null
          primary_surgeon_id?: string; procedure_name?: string; procedure_code?: string | null
          scheduled_start?: string; scheduled_end?: string; actual_start?: string | null; actual_end?: string | null
          status?: OrCaseStatus; anesthesia_type?: AnesthesiaType
          pre_op_notes?: string | null; post_op_notes?: string | null
          created_by?: string | null; created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'or_cases_patient_id_fkey'; columns: ['patient_id']; isOneToOne: false; referencedRelation: 'patients'; referencedColumns: ['id'] },
          { foreignKeyName: 'or_cases_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
          { foreignKeyName: 'or_cases_room_id_fkey'; columns: ['room_id']; isOneToOne: false; referencedRelation: 'rooms'; referencedColumns: ['id'] },
        ]
      }
      inventory_items: {
        Row: {
          id: string; hospital_id: string; name: string; sku: string | null; category: string | null
          quantity_on_hand: number; reorder_level: number; cost_per_unit: number | null
          expiry_date: string | null; drug_id: string | null; location: string | null
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; hospital_id: string; name: string; sku?: string | null; category?: string | null
          quantity_on_hand?: number; reorder_level?: number; cost_per_unit?: number | null
          expiry_date?: string | null; drug_id?: string | null; location?: string | null
          is_active?: boolean; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; name?: string; sku?: string | null; category?: string | null
          quantity_on_hand?: number; reorder_level?: number; cost_per_unit?: number | null
          expiry_date?: string | null; drug_id?: string | null; location?: string | null
          is_active?: boolean; created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'inventory_items_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
        ]
      }
      inventory_transactions: {
        Row: {
          id: string; hospital_id: string; item_id: string
          transaction_type: InventoryTransactionType; quantity: number
          reference: string | null; notes: string | null; performed_by: string | null; created_at: string
        }
        Insert: {
          id?: string; hospital_id: string; item_id: string
          transaction_type: InventoryTransactionType; quantity: number
          reference?: string | null; notes?: string | null; performed_by?: string | null; created_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; item_id?: string
          transaction_type?: InventoryTransactionType; quantity?: number
          reference?: string | null; notes?: string | null; performed_by?: string | null; created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'inventory_transactions_item_id_fkey'; columns: ['item_id']; isOneToOne: false; referencedRelation: 'inventory_items'; referencedColumns: ['id'] },
        ]
      }
      inventory_alerts: {
        Row: {
          id: string; hospital_id: string; item_id: string; alert_type: InventoryAlertType
          is_resolved: boolean; resolved_by: string | null; resolved_at: string | null; created_at: string
        }
        Insert: {
          id?: string; hospital_id: string; item_id: string; alert_type: InventoryAlertType
          is_resolved?: boolean; resolved_by?: string | null; resolved_at?: string | null; created_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; item_id?: string; alert_type?: InventoryAlertType
          is_resolved?: boolean; resolved_by?: string | null; resolved_at?: string | null; created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'inventory_alerts_item_id_fkey'; columns: ['item_id']; isOneToOne: false; referencedRelation: 'inventory_items'; referencedColumns: ['id'] },
        ]
      }
      beds: {
        Row: {
          id: string; hospital_id: string; room_id: string; bed_number: string
          is_available: boolean; current_patient_id: string | null
          current_admission_id: string | null; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; hospital_id: string; room_id: string; bed_number: string
          is_available?: boolean; current_patient_id?: string | null
          current_admission_id?: string | null; notes?: string | null
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; hospital_id?: string; room_id?: string; bed_number?: string
          is_available?: boolean; current_patient_id?: string | null
          current_admission_id?: string | null; notes?: string | null
          created_at?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'beds_room_id_fkey'; columns: ['room_id']; isOneToOne: false; referencedRelation: 'rooms'; referencedColumns: ['id'] },
          { foreignKeyName: 'beds_hospital_id_fkey'; columns: ['hospital_id']; isOneToOne: false; referencedRelation: 'hospitals'; referencedColumns: ['id'] },
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
      allergen_type: AllergenType
      allergy_severity: AllergySeverity
      allergy_status: AllergyStatus
      diagnosis_status: DiagnosisStatus
      drug_form: DrugForm
      drug_category: DrugCategory
      prescription_status: PrescriptionStatus
      medication_order_status: MedicationOrderStatus
      medication_route: MedicationRoute
      lab_sample_type: LabSampleType
      lab_order_priority: LabOrderPriority
      lab_order_status: LabOrderStatus
      discharge_summary_status: DischargeSummaryStatus
      notification_channel: NotificationChannel
      notification_status: NotificationStatus
      shift_type: ShiftType
      swap_request_status: SwapRequestStatus
      triage_level: TriageLevel
      opd_status: OpdStatus
      or_case_status: OrCaseStatus
      anesthesia_type: AnesthesiaType
      inventory_transaction_type: InventoryTransactionType
      inventory_alert_type: InventoryAlertType
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
export type PatientAllergy = Database['public']['Tables']['patient_allergies']['Row']
export type PatientDiagnosis = Database['public']['Tables']['patient_diagnoses']['Row']
export type VitalSigns = Database['public']['Tables']['vital_signs']['Row']
export type DrugFormulary = Database['public']['Tables']['drug_formulary']['Row']
export type Prescription = Database['public']['Tables']['prescriptions']['Row']
export type MedicationOrder = Database['public']['Tables']['medication_orders']['Row']
export type LabTestCatalogue = Database['public']['Tables']['lab_test_catalogue']['Row']
export type LabOrder = Database['public']['Tables']['lab_orders']['Row']
export type LabResult = Database['public']['Tables']['lab_results']['Row']
export type DischargeSummary = Database['public']['Tables']['discharge_summaries']['Row']
export type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row']
export type NotificationLog = Database['public']['Tables']['notification_log']['Row']
export type ShiftSchedule = Database['public']['Tables']['shift_schedules']['Row']
export type ShiftSwapRequest = Database['public']['Tables']['shift_swap_requests']['Row']
export type OpdQueueEntry = Database['public']['Tables']['opd_queue']['Row']
export type OrCase = Database['public']['Tables']['or_cases']['Row']
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type InventoryTransaction = Database['public']['Tables']['inventory_transactions']['Row']
export type InventoryAlert = Database['public']['Tables']['inventory_alerts']['Row']
export type Bed = Database['public']['Tables']['beds']['Row']
