-- Patient Portal Schema: link patients to auth users, add clinical fields, feedback, documents

-- 1. Add user_id to patients (links patient record to auth user for portal access)
ALTER TABLE patients ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX idx_patients_user_id ON patients(user_id) WHERE user_id IS NOT NULL;

-- 2. Add clinical fields to patients
ALTER TABLE patients ADD COLUMN allergies text;
ALTER TABLE patients ADD COLUMN medical_notes text;

COMMENT ON COLUMN patients.user_id IS 'Links patient record to auth user for self-service portal access';
COMMENT ON COLUMN patients.allergies IS 'Known allergies (staff-managed, patient read-only)';
COMMENT ON COLUMN patients.medical_notes IS 'General medical notes (staff-managed, patient read-only)';

-- 3. Document type enum
CREATE TYPE document_type AS ENUM ('INSURANCE_CARD', 'ID_DOCUMENT', 'REFERRAL_LETTER', 'OTHER');

-- 4. Feedback table
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  admission_id uuid REFERENCES admissions(id),
  appointment_id uuid REFERENCES appointments(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_hospital_patient ON feedback(hospital_id, patient_id);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 5. Patient documents table
CREATE TABLE patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  document_type document_type NOT NULL DEFAULT 'OTHER',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_documents_hospital_patient ON patient_documents(hospital_id, patient_id);
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- 6. Helper function: get patient_id for the current auth user
CREATE OR REPLACE FUNCTION my_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM patients WHERE user_id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION my_patient_id() IS 'Returns the patient record ID linked to the current auth user';
