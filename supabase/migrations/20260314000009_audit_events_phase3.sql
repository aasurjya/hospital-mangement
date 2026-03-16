-- Migration: Add Phase 3 audit event types
-- Idempotent via DO $$ block.

do $$ begin
  alter type public.audit_event_type add value if not exists 'PATIENT_CREATED';
  alter type public.audit_event_type add value if not exists 'PATIENT_UPDATED';
  alter type public.audit_event_type add value if not exists 'APPOINTMENT_CREATED';
  alter type public.audit_event_type add value if not exists 'APPOINTMENT_UPDATED';
  alter type public.audit_event_type add value if not exists 'ADMISSION_CREATED';
  alter type public.audit_event_type add value if not exists 'ADMISSION_DISCHARGED';
  alter type public.audit_event_type add value if not exists 'RECORD_CREATED';
  alter type public.audit_event_type add value if not exists 'RECORD_FINALIZED';
  alter type public.audit_event_type add value if not exists 'DEPARTMENT_CREATED';
  alter type public.audit_event_type add value if not exists 'DEPARTMENT_UPDATED';
exception when others then null;
end $$;
