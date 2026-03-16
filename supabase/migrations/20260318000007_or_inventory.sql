-- Phase 15: OR Scheduling + Inventory

DO $$ BEGIN CREATE TYPE or_case_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE anesthesia_type AS ENUM ('GENERAL', 'LOCAL', 'REGIONAL', 'SPINAL', 'EPIDURAL', 'SEDATION', 'NONE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inventory_transaction_type AS ENUM ('PURCHASE', 'DISPENSED', 'ADJUSTMENT', 'EXPIRED', 'RETURNED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inventory_alert_type AS ENUM ('LOW_STOCK', 'EXPIRED', 'EXPIRING_SOON'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS or_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  primary_surgeon_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  procedure_name text NOT NULL,
  procedure_code text,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  status or_case_status NOT NULL DEFAULT 'SCHEDULED',
  anesthesia_type anesthesia_type NOT NULL DEFAULT 'GENERAL',
  pre_op_notes text,
  post_op_notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_or_cases_hospital ON or_cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_or_cases_schedule ON or_cases(hospital_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_or_cases_surgeon ON or_cases(primary_surgeon_id);
CREATE INDEX IF NOT EXISTS idx_or_cases_room ON or_cases(room_id);

ALTER TABLE or_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_or_cases_select ON or_cases
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_or_cases_all ON or_cases
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_or_cases_insert ON or_cases
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_or_cases_update ON or_cases
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  category text,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 10,
  cost_per_unit numeric(10,2),
  expiry_date date,
  drug_id uuid REFERENCES drug_formulary(id) ON DELETE SET NULL,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_hospital ON inventory_items(hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(hospital_id) WHERE quantity_on_hand <= reorder_level;

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_inventory_select ON inventory_items
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_inventory_all ON inventory_items
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_inventory_insert ON inventory_items
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_inventory_update ON inventory_items
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type inventory_transaction_type NOT NULL,
  quantity integer NOT NULL,
  reference text,
  notes text,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_hospital ON inventory_transactions(hospital_id);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_inv_tx_select ON inventory_transactions
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_inv_tx_all ON inventory_transactions
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_inv_tx_insert ON inventory_transactions
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_type inventory_alert_type NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_hospital ON inventory_alerts(hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_active ON inventory_alerts(hospital_id) WHERE NOT is_resolved;

ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_inv_alerts_select ON inventory_alerts
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_inv_alerts_all ON inventory_alerts
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_inv_alerts_insert ON inventory_alerts
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY staff_inv_alerts_update ON inventory_alerts
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'OR_CASE_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'OR_CASE_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'INVENTORY_ITEM_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'INVENTORY_TRANSACTION';

DROP TRIGGER IF EXISTS or_cases_updated_at ON or_cases;
CREATE TRIGGER or_cases_updated_at
  BEFORE UPDATE ON or_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS inventory_items_updated_at ON inventory_items;
CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE or_cases IS 'Operating room case scheduling';
COMMENT ON TABLE inventory_items IS 'Hospital inventory with reorder tracking';
COMMENT ON TABLE inventory_transactions IS 'Inventory transaction history';
COMMENT ON TABLE inventory_alerts IS 'Low stock, expired, and expiring alerts';
