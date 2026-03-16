-- Phase 13: Email/SMS Notifications

DO $$ BEGIN CREATE TYPE notification_channel AS ENUM ('EMAIL', 'SMS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'EMAIL',
  subject text,
  body_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, event_key, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_hospital ON notification_templates(hospital_id);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_notification_templates_select ON notification_templates
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_notification_templates_all ON notification_templates
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY admin_notification_templates_write ON notification_templates
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());
CREATE POLICY admin_notification_templates_update ON notification_templates
  FOR UPDATE TO authenticated USING (hospital_id = my_hospital_id());

CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  template_id uuid REFERENCES notification_templates(id) ON DELETE SET NULL,
  recipient_email text,
  recipient_phone text,
  channel notification_channel NOT NULL,
  subject text,
  body text NOT NULL,
  status notification_status NOT NULL DEFAULT 'PENDING',
  error_message text,
  related_entity_type text,
  related_entity_id uuid,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_hospital ON notification_log(hospital_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_log_pending ON notification_log(status) WHERE status = 'PENDING';

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_notification_log_select ON notification_log
  FOR SELECT TO authenticated USING (hospital_id = my_hospital_id());
CREATE POLICY platform_notification_log_all ON notification_log
  FOR ALL TO authenticated USING (is_platform_admin());
CREATE POLICY staff_notification_log_insert ON notification_log
  FOR INSERT TO authenticated WITH CHECK (hospital_id = my_hospital_id());

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'NOTIFICATION_TEMPLATE_CREATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'NOTIFICATION_TEMPLATE_UPDATED';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'NOTIFICATION_SENT';

DROP TRIGGER IF EXISTS notification_templates_updated_at ON notification_templates;
CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE notification_templates IS 'Per-hospital notification templates with variable interpolation';
COMMENT ON TABLE notification_log IS 'Notification delivery log and queue';
