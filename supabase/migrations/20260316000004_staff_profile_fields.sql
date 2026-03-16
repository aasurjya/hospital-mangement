-- Staff Profile Enhancement: add professional, employment, and personal fields to user_profiles

-- Employment type enum
CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT');

-- Professional fields
ALTER TABLE user_profiles ADD COLUMN specialty text;
ALTER TABLE user_profiles ADD COLUMN qualifications text;
ALTER TABLE user_profiles ADD COLUMN license_number text;
ALTER TABLE user_profiles ADD COLUMN license_expiry date;
ALTER TABLE user_profiles ADD COLUMN registration_number text;
ALTER TABLE user_profiles ADD COLUMN years_of_experience integer;

-- Employment fields
ALTER TABLE user_profiles ADD COLUMN department_id uuid REFERENCES departments(id);
ALTER TABLE user_profiles ADD COLUMN employment_type employment_type;
ALTER TABLE user_profiles ADD COLUMN hire_date date;

-- Personal fields
ALTER TABLE user_profiles ADD COLUMN address text;
ALTER TABLE user_profiles ADD COLUMN emergency_contact_name text;
ALTER TABLE user_profiles ADD COLUMN emergency_contact_phone text;

-- Index on department_id for joins
CREATE INDEX idx_user_profiles_department_id ON user_profiles(department_id);

COMMENT ON COLUMN user_profiles.specialty IS 'Medical specialization, e.g. Cardiology, Pediatrics (clinical roles)';
COMMENT ON COLUMN user_profiles.license_number IS 'Professional medical license number issued by licensing board';
COMMENT ON COLUMN user_profiles.license_expiry IS 'License expiration date for compliance tracking';
COMMENT ON COLUMN user_profiles.registration_number IS 'Professional regulatory body registration number';
COMMENT ON COLUMN user_profiles.qualifications IS 'Degrees and certifications, e.g. MBBS, MD, BSN';
COMMENT ON COLUMN user_profiles.years_of_experience IS 'Years of professional practice';
COMMENT ON COLUMN user_profiles.department_id IS 'Primary department assignment';
COMMENT ON COLUMN user_profiles.employment_type IS 'Employment classification';
COMMENT ON COLUMN user_profiles.hire_date IS 'Employment start date';
COMMENT ON COLUMN user_profiles.address IS 'Residential address';
COMMENT ON COLUMN user_profiles.emergency_contact_name IS 'Staff emergency contact name';
COMMENT ON COLUMN user_profiles.emergency_contact_phone IS 'Staff emergency contact phone';
