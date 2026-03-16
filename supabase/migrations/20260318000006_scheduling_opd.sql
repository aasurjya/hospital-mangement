-- Phase 14: Staff Scheduling + OPD Queue

DO $$ BEGIN CREATE TYPE shift_type AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT', 'ON_CALL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE swap_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE triage_level AS ENUM ('EMERGENCY', 'URGENT', 'SEMI_URGENT', 'NON_URGENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE opd_status AS ENUM ('WAITING', 'IN_CONSULTATION', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS shift_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  shift_type shift_type NOT NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_schedules_hospital ON shift_schedules(hospital_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_staff ON shift_schedules(staff_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON shift_schedules(hospital_id, shift_date);

ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_shifts_select ON shift_schedules
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_shifts_all ON shift_schedules
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_shifts_insert ON shift_schedules
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_shifts_update ON shift_schedules
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY staff_shifts_delete ON shift_schedules
  FOR DELETE TO authenticated USING (hospital_id = my_hospital_id());

CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  requester_shift_id uuid NOT NULL REFERENCES shift_schedules(id) ON DELETE CASCADE,
  target_staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status swap_request_status NOT NULL DEFAULT 'PENDING',
  reason text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swap_requests_hospital ON shift_swap_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON shift_swap_requests(hospital_id, status);

ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_swaps_select ON shift_swap_requests
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_swaps_all ON shift_swap_requests
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_swaps_insert ON shift_swap_requests
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_swaps_update ON shift_swap_requests
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

CREATE TABLE IF NOT EXISTS opd_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token_number integer NOT NULL,
  triage_level triage_level NOT NULL DEFAULT 'NON_URGENT',
  status opd_status NOT NULL DEFAULT 'WAITING',
  vital_signs_id uuid REFERENCES vital_signs(id) ON DELETE SET NULL,
  chief_complaint text,
  checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  consultation_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opd_queue_hospital ON opd_queue(hospital_id);
CREATE INDEX IF NOT EXISTS idx_opd_queue_date ON opd_queue(hospital_id, checked_in_at::date);
CREATE INDEX IF NOT EXISTS idx_opd_queue_status ON opd_queue(hospital_id, status);

ALTER TABLE opd_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_opd_select ON opd_queue
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_opd_all ON opd_queue
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_opd_insert ON opd_queue
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_opd_update ON opd_queue
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'SHIFT_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'SHIFT_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'SWAP_REQUESTED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'SWAP_REVIEWED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'OPD_CHECK_IN';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'OPD_STATUS_UPDATED';

DROP TRIGGER IF EXISTS shift_schedules_updated_at ON shift_schedules;
CREATE TRIGGER shift_schedules_updated_at
  BEFORE UPDATE ON shift_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE shift_schedules IS 'Staff shift schedules with department assignment';
COMMENT ON TABLE shift_swap_requests IS 'Shift swap requests between staff members';
COMMENT ON TABLE opd_queue IS 'Outpatient department queue with triage levels';
