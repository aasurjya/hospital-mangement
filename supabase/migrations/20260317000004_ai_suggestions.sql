-- AI Clinical Assistant: suggestions table, enums, audit events

-- Enums
CREATE TYPE ai_suggestion_type AS ENUM ('SOAP_NOTE', 'DIFFERENTIAL_DIAGNOSIS', 'DRUG_INTERACTION', 'PATIENT_SUMMARY');
CREATE TYPE ai_suggestion_status AS ENUM ('PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED');

-- AI suggestions table
CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type ai_suggestion_type NOT NULL,
  input_text text NOT NULL,
  output_text text NOT NULL,
  model_used text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  status ai_suggestion_status NOT NULL DEFAULT 'PENDING',
  modified_text text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_suggestions_hospital ON ai_suggestions(hospital_id);
CREATE INDEX idx_ai_suggestions_doctor ON ai_suggestions(doctor_id);
CREATE INDEX idx_ai_suggestions_patient ON ai_suggestions(patient_id);
CREATE INDEX idx_ai_suggestions_rate_limit ON ai_suggestions(hospital_id, doctor_id, created_at DESC);
CREATE INDEX idx_ai_suggestions_history ON ai_suggestions(hospital_id, patient_id, created_at DESC);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS: staff in same hospital can read
CREATE POLICY staff_ai_suggestions_select ON ai_suggestions
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

-- RLS: platform admin full access
CREATE POLICY platform_ai_suggestions_all ON ai_suggestions
  FOR ALL TO authenticated
  USING (is_platform_admin());

-- RLS: doctor can insert own suggestions
CREATE POLICY doctor_ai_suggestions_insert ON ai_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (hospital_id = my_hospital_id() AND doctor_id = auth.uid());

-- RLS: doctor can update own suggestions (resolve)
CREATE POLICY doctor_ai_suggestions_update ON ai_suggestions
  FOR UPDATE TO authenticated
  USING (hospital_id = my_hospital_id() AND doctor_id = auth.uid());

-- Audit event types
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'AI_SUGGESTION_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'AI_SUGGESTION_ACCEPTED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'AI_SUGGESTION_MODIFIED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'AI_SUGGESTION_REJECTED';

COMMENT ON TABLE ai_suggestions IS 'Audit trail for all AI clinical assistant interactions';
COMMENT ON COLUMN ai_suggestions.modified_text IS 'Doctor-edited version when status is MODIFIED';
