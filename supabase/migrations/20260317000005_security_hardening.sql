-- Security Hardening Migration
-- Fixes issues identified by security, database, and code reviews

-- =============================================================================
-- C-1: Prevent patients from updating clinical/identity fields via trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.prevent_patient_clinical_field_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'PATIENT' THEN
    IF NEW.hospital_id    IS DISTINCT FROM OLD.hospital_id    OR
       NEW.mrn            IS DISTINCT FROM OLD.mrn            OR
       NEW.full_name      IS DISTINCT FROM OLD.full_name      OR
       NEW.blood_type     IS DISTINCT FROM OLD.blood_type     OR
       NEW.allergies      IS DISTINCT FROM OLD.allergies      OR
       NEW.medical_notes  IS DISTINCT FROM OLD.medical_notes  OR
       NEW.is_active      IS DISTINCT FROM OLD.is_active      OR
       NEW.date_of_birth  IS DISTINCT FROM OLD.date_of_birth  OR
       NEW.gender         IS DISTINCT FROM OLD.gender         OR
       NEW.user_id        IS DISTINCT FROM OLD.user_id        OR
       NEW.insurance_provider IS DISTINCT FROM OLD.insurance_provider OR
       NEW.insurance_number   IS DISTINCT FROM OLD.insurance_number   OR
       NEW.created_by     IS DISTINCT FROM OLD.created_by
    THEN
      RAISE EXCEPTION 'Patients may not modify clinical or identity fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER patients_protect_clinical_fields
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.prevent_patient_clinical_field_update();

-- =============================================================================
-- C-2: Fix search_path on all SECURITY DEFINER functions
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp AS $$
  SELECT exists (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'PLATFORM_ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_hospital_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp AS $$
  SELECT hospital_id FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_patient_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT id FROM public.patients WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =============================================================================
-- C-3: Fix ai_suggestions.doctor_id ON DELETE CASCADE -> SET NULL
-- =============================================================================
ALTER TABLE ai_suggestions DROP CONSTRAINT IF EXISTS ai_suggestions_doctor_id_fkey;
ALTER TABLE ai_suggestions ALTER COLUMN doctor_id DROP NOT NULL;
ALTER TABLE ai_suggestions ADD CONSTRAINT ai_suggestions_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================================================
-- C-4: Add ON DELETE CASCADE to feedback and patient_documents FKs
-- =============================================================================
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_hospital_id_fkey;
ALTER TABLE feedback ADD CONSTRAINT feedback_hospital_id_fkey
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_patient_id_fkey;
ALTER TABLE feedback ADD CONSTRAINT feedback_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE patient_documents DROP CONSTRAINT IF EXISTS patient_documents_hospital_id_fkey;
ALTER TABLE patient_documents ADD CONSTRAINT patient_documents_hospital_id_fkey
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

ALTER TABLE patient_documents DROP CONSTRAINT IF EXISTS patient_documents_patient_id_fkey;
ALTER TABLE patient_documents ADD CONSTRAINT patient_documents_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- =============================================================================
-- C-5: Restrict patient_select_staff_profiles to clinical roles + safe columns
-- =============================================================================
DROP POLICY IF EXISTS patient_select_staff_profiles ON user_profiles;
CREATE POLICY patient_select_staff_profiles ON user_profiles
  FOR SELECT TO authenticated
  USING (
    hospital_id = (SELECT hospital_id FROM patients WHERE user_id = auth.uid() LIMIT 1)
    AND role IN ('DOCTOR', 'NURSE')
    AND is_active = true
  );

-- =============================================================================
-- C-6: Fix staff write policies on feedback and patient_documents
-- =============================================================================
DROP POLICY IF EXISTS staff_feedback_all ON feedback;
CREATE POLICY platform_admin_all_feedback ON feedback
  FOR ALL TO authenticated
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

CREATE POLICY staff_manage_feedback ON feedback
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.my_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.my_hospital_id()));

DROP POLICY IF EXISTS staff_documents_all ON patient_documents;
CREATE POLICY platform_admin_all_documents ON patient_documents
  FOR ALL TO authenticated
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

CREATE POLICY staff_manage_documents ON patient_documents
  FOR ALL TO authenticated
  USING (hospital_id = (SELECT public.my_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.my_hospital_id()));

-- =============================================================================
-- C-7: Wrap my_patient_id() calls in (SELECT ...) for patient portal RLS
-- =============================================================================
DROP POLICY IF EXISTS patient_select_own_appointments ON appointments;
CREATE POLICY patient_select_own_appointments ON appointments
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.my_patient_id()));

DROP POLICY IF EXISTS patient_select_own_admissions ON admissions;
CREATE POLICY patient_select_own_admissions ON admissions
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.my_patient_id()));

DROP POLICY IF EXISTS patient_select_own_finalized_records ON medical_records;
CREATE POLICY patient_select_own_finalized_records ON medical_records
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.my_patient_id()) AND status = 'FINALIZED');

DROP POLICY IF EXISTS patient_select_own_invoices ON invoices;
CREATE POLICY patient_select_own_invoices ON invoices
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.my_patient_id()));

DROP POLICY IF EXISTS patient_select_own_invoice_items ON invoice_items;
CREATE POLICY patient_select_own_invoice_items ON invoice_items
  FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE patient_id = (SELECT public.my_patient_id())));

DROP POLICY IF EXISTS patient_select_own_payments ON payments;
CREATE POLICY patient_select_own_payments ON payments
  FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE patient_id = (SELECT public.my_patient_id())));

DROP POLICY IF EXISTS patient_select_own_feedback ON feedback;
CREATE POLICY patient_select_own_feedback ON feedback
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.my_patient_id()));

DROP POLICY IF EXISTS patient_insert_own_feedback ON feedback;
CREATE POLICY patient_insert_own_feedback ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = (SELECT public.my_patient_id()));

DROP POLICY IF EXISTS patient_select_own_documents ON patient_documents;
CREATE POLICY patient_select_own_documents ON patient_documents
  FOR SELECT TO authenticated
  USING (patient_id = (SELECT public.my_patient_id()));

DROP POLICY IF EXISTS patient_insert_own_documents ON patient_documents;
CREATE POLICY patient_insert_own_documents ON patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id = (SELECT public.my_patient_id())
    AND hospital_id = (SELECT hospital_id FROM patients WHERE id = (SELECT public.my_patient_id()))
  );

-- =============================================================================
-- C-8: Add uniqueness constraint on feedback per patient+appointment/admission
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique_appointment
  ON feedback(patient_id, appointment_id) WHERE appointment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique_admission
  ON feedback(patient_id, admission_id) WHERE admission_id IS NOT NULL;
