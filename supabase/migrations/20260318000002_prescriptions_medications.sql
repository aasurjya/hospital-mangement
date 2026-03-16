-- Phase 10: Prescriptions & Medications — drug_formulary, prescriptions, medication_orders

-- Enums
DO $$ BEGIN CREATE TYPE drug_form AS ENUM ('TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'TOPICAL', 'INHALER', 'DROPS', 'SUPPOSITORY', 'PATCH', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE drug_category AS ENUM ('ANTIBIOTIC', 'ANALGESIC', 'ANTIHYPERTENSIVE', 'ANTIDIABETIC', 'ANTICOAGULANT', 'ANTIDEPRESSANT', 'ANTIPSYCHOTIC', 'CARDIOVASCULAR', 'RESPIRATORY', 'GASTROINTESTINAL', 'ENDOCRINE', 'IMMUNOSUPPRESSANT', 'VITAMIN', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE prescription_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'DISCONTINUED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE medication_order_status AS ENUM ('ORDERED', 'DISPENSED', 'ADMINISTERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE medication_route AS ENUM ('ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALATION', 'RECTAL', 'SUBLINGUAL', 'TRANSDERMAL', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drug formulary (hospital-level medication catalogue)
CREATE TABLE IF NOT EXISTS drug_formulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  generic_name text NOT NULL,
  brand_name text,
  form drug_form NOT NULL DEFAULT 'TABLET',
  strength text,
  category drug_category NOT NULL DEFAULT 'OTHER',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, generic_name, form, strength)
);

CREATE INDEX IF NOT EXISTS idx_drug_formulary_hospital ON drug_formulary(hospital_id);
CREATE INDEX IF NOT EXISTS idx_drug_formulary_name ON drug_formulary(hospital_id, generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_formulary_category ON drug_formulary(hospital_id, category);

ALTER TABLE drug_formulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_drug_formulary_select ON drug_formulary
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY platform_drug_formulary_all ON drug_formulary
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_drug_formulary_insert ON drug_formulary
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id());

CREATE POLICY staff_drug_formulary_update ON drug_formulary
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id());

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  drug_id uuid REFERENCES drug_formulary(id) ON DELETE SET NULL,
  drug_name text NOT NULL,
  dosage text NOT NULL,
  route medication_route NOT NULL DEFAULT 'ORAL',
  frequency text NOT NULL,
  duration text,
  quantity integer,
  refills integer NOT NULL DEFAULT 0,
  status prescription_status NOT NULL DEFAULT 'ACTIVE',
  allergy_override boolean NOT NULL DEFAULT false,
  allergy_override_reason text,
  notes text,
  prescribed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admission_id uuid REFERENCES admissions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_hospital ON prescriptions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_active ON prescriptions(patient_id, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_prescriptions_drug ON prescriptions(drug_id);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_prescriptions_select ON prescriptions
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY platform_prescriptions_all ON prescriptions
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_prescriptions_insert ON prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id());

CREATE POLICY staff_prescriptions_update ON prescriptions
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id());

-- Medication orders (dispense → administer lifecycle)
CREATE TABLE IF NOT EXISTS medication_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status medication_order_status NOT NULL DEFAULT 'ORDERED',
  ordered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispensed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispensed_at timestamptz,
  administered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  administered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_orders_prescription ON medication_orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medication_orders_patient ON medication_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_orders_hospital ON medication_orders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medication_orders_status ON medication_orders(hospital_id, status);

ALTER TABLE medication_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_medication_orders_select ON medication_orders
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY platform_medication_orders_all ON medication_orders
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_medication_orders_insert ON medication_orders
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id());

CREATE POLICY staff_medication_orders_update ON medication_orders
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id());

-- Audit event types
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'FORMULARY_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'FORMULARY_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'PRESCRIPTION_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'PRESCRIPTION_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'MEDICATION_DISPENSED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'MEDICATION_ADMINISTERED';

-- Updated_at triggers
DROP TRIGGER IF EXISTS drug_formulary_updated_at ON drug_formulary;
CREATE TRIGGER drug_formulary_updated_at
  BEFORE UPDATE ON drug_formulary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS prescriptions_updated_at ON prescriptions;
CREATE TRIGGER prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS medication_orders_updated_at ON medication_orders;
CREATE TRIGGER medication_orders_updated_at
  BEFORE UPDATE ON medication_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE drug_formulary IS 'Hospital-level medication catalogue';
COMMENT ON TABLE prescriptions IS 'Patient prescriptions with drug-allergy override tracking';
COMMENT ON TABLE medication_orders IS 'Medication order lifecycle: ordered → dispensed → administered';
