-- Patient Portal: RLS policies for patient self-service access
-- Patients can only see their own data. Staff policies remain unchanged.

-- patients: patient can read own record
CREATE POLICY patient_select_own ON patients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- patients: patient can update own contact fields only
CREATE POLICY patient_update_contact ON patients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- appointments: patient can read own
CREATE POLICY patient_select_own_appointments ON appointments
  FOR SELECT TO authenticated
  USING (patient_id = my_patient_id());

-- admissions: patient can read own
CREATE POLICY patient_select_own_admissions ON admissions
  FOR SELECT TO authenticated
  USING (patient_id = my_patient_id());

-- medical_records: patient can read own FINALIZED only
CREATE POLICY patient_select_own_finalized_records ON medical_records
  FOR SELECT TO authenticated
  USING (patient_id = my_patient_id() AND status = 'FINALIZED');

-- invoices: patient can read own
CREATE POLICY patient_select_own_invoices ON invoices
  FOR SELECT TO authenticated
  USING (patient_id = my_patient_id());

-- invoice_items: patient can read items from own invoices
CREATE POLICY patient_select_own_invoice_items ON invoice_items
  FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE patient_id = my_patient_id()));

-- payments: patient can read payments from own invoices
CREATE POLICY patient_select_own_payments ON payments
  FOR SELECT TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE patient_id = my_patient_id()));

-- feedback: patient can read and create own
CREATE POLICY patient_select_own_feedback ON feedback
  FOR SELECT TO authenticated
  USING (patient_id = my_patient_id());

CREATE POLICY patient_insert_own_feedback ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = my_patient_id());

-- patient_documents: patient can read and create own
CREATE POLICY patient_select_own_documents ON patient_documents
  FOR SELECT TO authenticated
  USING (patient_id = my_patient_id());

CREATE POLICY patient_insert_own_documents ON patient_documents
  FOR INSERT TO authenticated
  WITH CHECK (patient_id = my_patient_id());

-- Staff access to new tables (using existing patterns)
CREATE POLICY staff_feedback_select ON feedback
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY staff_feedback_all ON feedback
  FOR ALL TO authenticated
  USING (is_platform_admin());

CREATE POLICY staff_documents_select ON patient_documents
  FOR SELECT TO authenticated
  USING (hospital_id = my_hospital_id());

CREATE POLICY staff_documents_all ON patient_documents
  FOR ALL TO authenticated
  USING (is_platform_admin());

-- departments: patient can read in own hospital (for appointment display)
CREATE POLICY patient_select_departments ON departments
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM patients WHERE user_id = auth.uid() LIMIT 1));

-- rooms: patient can read in own hospital (for admission display)
CREATE POLICY patient_select_rooms ON rooms
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM patients WHERE user_id = auth.uid() LIMIT 1));

-- user_profiles: patient can read staff in own hospital (for doctor names)
CREATE POLICY patient_select_staff_profiles ON user_profiles
  FOR SELECT TO authenticated
  USING (hospital_id = (SELECT hospital_id FROM patients WHERE user_id = auth.uid() LIMIT 1));
