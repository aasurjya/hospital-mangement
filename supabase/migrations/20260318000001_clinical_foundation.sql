-- Phase 9: Clinical Foundation — patient_allergies, patient_diagnoses, vital_signs

-- Enums
DO $$ BEGIN CREATE TYPE allergen_type AS ENUM ('DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE allergy_severity AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE allergy_status AS ENUM ('ACTIVE', 'INACTIVE', 'RESOLVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE diagnosis_status AS ENUM ('ACTIVE', 'RESOLVED', 'CHRONIC', 'RULED_OUT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Patient allergies
CREATE TABLE IF NOT EXISTS patient_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen_name text NOT NULL,
  allergen_type allergen_type NOT NULL DEFAULT 'OTHER',
  severity allergy_severity NOT NULL DEFAULT 'MODERATE',
  reaction text,
  status allergy_status NOT NULL DEFAULT 'ACTIVE',
  onset_date date,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_hospital ON patient_allergies(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON patient_allergies(patient_id, status) WHERE status = 'ACTIVE';

ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_patient_allergies_select ON patient_allergies
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY platform_patient_allergies_all ON patient_allergies
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_patient_allergies_insert ON patient_allergies
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id());

CREATE POLICY staff_patient_allergies_update ON patient_allergies
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY staff_patient_allergies_delete ON patient_allergies
  FOR DELETE TO authenticated
  USING (hospital_id = my_hospital_id());

-- Patient diagnoses
CREATE TABLE IF NOT EXISTS patient_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id uuid REFERENCES medical_records(id) ON DELETE SET NULL,
  icd10_code text,
  description text NOT NULL,
  status diagnosis_status NOT NULL DEFAULT 'ACTIVE',
  diagnosed_date date NOT NULL DEFAULT CURRENT_DATE,
  resolved_date date,
  notes text,
  diagnosed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient ON patient_diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_hospital ON patient_diagnoses(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_active ON patient_diagnoses(patient_id, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_icd10 ON patient_diagnoses(icd10_code) WHERE icd10_code IS NOT NULL;

ALTER TABLE patient_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_patient_diagnoses_select ON patient_diagnoses
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY platform_patient_diagnoses_all ON patient_diagnoses
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_patient_diagnoses_insert ON patient_diagnoses
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id());

CREATE POLICY staff_patient_diagnoses_update ON patient_diagnoses
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id());

-- Vital signs
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admission_id uuid REFERENCES admissions(id) ON DELETE SET NULL,
  systolic_bp smallint,
  diastolic_bp smallint,
  heart_rate smallint,
  temperature numeric(4,1),
  respiratory_rate smallint,
  o2_saturation smallint,
  weight_kg numeric(5,1),
  height_cm numeric(5,1),
  bmi numeric(4,1),
  pain_scale smallint CHECK (pain_scale >= 0 AND pain_scale <= 10),
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_hospital ON vital_signs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_admission ON vital_signs(admission_id) WHERE admission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded ON vital_signs(patient_id, recorded_at DESC);

ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_vital_signs_select ON vital_signs
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY platform_vital_signs_all ON vital_signs
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_vital_signs_insert ON vital_signs
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id());

CREATE POLICY staff_vital_signs_update ON vital_signs
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id());

-- Audit event types
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ALLERGY_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ALLERGY_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'ALLERGY_DELETED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'DIAGNOSIS_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'DIAGNOSIS_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'VITAL_SIGNS_RECORDED';

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patient_allergies_updated_at ON patient_allergies;
CREATE TRIGGER patient_allergies_updated_at
  BEFORE UPDATE ON patient_allergies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS patient_diagnoses_updated_at ON patient_diagnoses;
CREATE TRIGGER patient_diagnoses_updated_at
  BEFORE UPDATE ON patient_diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE patient_allergies IS 'Patient allergy records with severity and reaction tracking';
COMMENT ON TABLE patient_diagnoses IS 'Patient diagnosis records with ICD-10 coding';
COMMENT ON TABLE vital_signs IS 'Patient vital sign measurements with trend tracking';
