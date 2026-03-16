-- Phase 11: Lab Orders & Results — lab_test_catalogue, lab_orders, lab_results

-- Enums
DO $$ BEGIN CREATE TYPE lab_sample_type AS ENUM ('BLOOD', 'URINE', 'STOOL', 'CSF', 'SPUTUM', 'SWAB', 'TISSUE', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lab_order_priority AS ENUM ('ROUTINE', 'URGENT', 'STAT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lab_order_status AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lab test catalogue (hospital-level)
CREATE TABLE IF NOT EXISTS lab_test_catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_code text,
  category text,
  sample_type lab_sample_type NOT NULL DEFAULT 'BLOOD',
  normal_range text,
  unit text,
  turnaround_hours integer,
  price numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, test_code)
);

CREATE INDEX IF NOT EXISTS idx_lab_test_catalogue_hospital ON lab_test_catalogue(hospital_id);

ALTER TABLE lab_test_catalogue ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_lab_catalogue_select ON lab_test_catalogue
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_lab_catalogue_all ON lab_test_catalogue
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_lab_catalogue_insert ON lab_test_catalogue
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_lab_catalogue_update ON lab_test_catalogue
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

-- Lab orders
CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  test_id uuid REFERENCES lab_test_catalogue(id) ON DELETE SET NULL,
  test_name text NOT NULL,
  priority lab_order_priority NOT NULL DEFAULT 'ROUTINE',
  status lab_order_status NOT NULL DEFAULT 'ORDERED',
  clinical_notes text,
  ordered_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  collected_at timestamptz,
  completed_at timestamptz,
  admission_id uuid REFERENCES admissions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_hospital ON lab_orders(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_number ON lab_orders(order_number);

ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_lab_orders_select ON lab_orders
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_lab_orders_all ON lab_orders
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_lab_orders_insert ON lab_orders
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_lab_orders_update ON lab_orders
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

-- Lab results
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  lab_order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  result_value text NOT NULL,
  unit text,
  normal_range text,
  is_abnormal boolean NOT NULL DEFAULT false,
  interpretation text,
  entered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_hospital ON lab_results(hospital_id);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_lab_results_select ON lab_results
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_lab_results_all ON lab_results
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_lab_results_insert ON lab_results
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_lab_results_update ON lab_results
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

-- Audit event types
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'LAB_ORDER_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'LAB_ORDER_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'LAB_RESULT_ENTERED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'LAB_RESULT_VERIFIED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'LAB_CATALOGUE_CREATED';

-- Updated_at triggers
DROP TRIGGER IF EXISTS lab_test_catalogue_updated_at ON lab_test_catalogue;
CREATE TRIGGER lab_test_catalogue_updated_at
  BEFORE UPDATE ON lab_test_catalogue FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lab_orders_updated_at ON lab_orders;
CREATE TRIGGER lab_orders_updated_at
  BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE lab_test_catalogue IS 'Hospital-level lab test menu with pricing';
COMMENT ON TABLE lab_orders IS 'Lab test orders with priority and lifecycle tracking';
COMMENT ON TABLE lab_results IS 'Lab test results with abnormal flagging and verification';
