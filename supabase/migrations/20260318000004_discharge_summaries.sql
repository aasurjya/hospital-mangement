-- Phase 12: Discharge Summaries

DO $$ BEGIN CREATE TYPE discharge_summary_status AS ENUM ('DRAFT', 'FINALIZED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS discharge_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  admission_id uuid NOT NULL UNIQUE REFERENCES admissions(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  admission_diagnosis text,
  discharge_diagnosis text,
  summary_of_stay text,
  procedures text,
  discharge_medications_json jsonb DEFAULT '[]'::jsonb,
  follow_up_instructions text,
  follow_up_date date,
  status discharge_summary_status NOT NULL DEFAULT 'DRAFT',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  finalized_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discharge_summaries_admission ON discharge_summaries(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient ON discharge_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_hospital ON discharge_summaries(hospital_id);

ALTER TABLE discharge_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_discharge_summaries_select ON discharge_summaries
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_discharge_summaries_all ON discharge_summaries
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_discharge_summaries_insert ON discharge_summaries
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_discharge_summaries_update ON discharge_summaries
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'DISCHARGE_SUMMARY_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'DISCHARGE_SUMMARY_FINALIZED';

DROP TRIGGER IF EXISTS discharge_summaries_updated_at ON discharge_summaries;
CREATE TRIGGER discharge_summaries_updated_at
  BEFORE UPDATE ON discharge_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE discharge_summaries IS 'Discharge summaries with medication snapshot and follow-up';
