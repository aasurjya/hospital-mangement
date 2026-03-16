-- Phase 16: Beds table for bed board and analytics

CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number text NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  current_patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  current_admission_id uuid REFERENCES admissions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, bed_number)
);

CREATE INDEX IF NOT EXISTS idx_beds_hospital ON beds(hospital_id);
CREATE INDEX IF NOT EXISTS idx_beds_room ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_available ON beds(hospital_id, is_available);
CREATE INDEX IF NOT EXISTS idx_beds_patient ON beds(current_patient_id) WHERE current_patient_id IS NOT NULL;

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_beds_select ON beds
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_beds_all ON beds
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_beds_insert ON beds
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_beds_update ON beds
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

-- Add optional bed_id to admissions
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS bed_id uuid REFERENCES beds(id) ON DELETE SET NULL;

-- Auto-populate 1 bed per existing room
INSERT INTO beds (hospital_id, room_id, bed_number, is_available)
SELECT r.hospital_id, r.id, r.room_number || '-A', r.is_available
FROM rooms r
WHERE NOT EXISTS (SELECT 1 FROM beds b WHERE b.room_id = r.id)
ON CONFLICT DO NOTHING;

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'BED_ASSIGNED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'BED_RELEASED';

DROP TRIGGER IF EXISTS beds_updated_at ON beds;
CREATE TRIGGER beds_updated_at
  BEFORE UPDATE ON beds FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE beds IS 'Individual bed tracking within rooms';
