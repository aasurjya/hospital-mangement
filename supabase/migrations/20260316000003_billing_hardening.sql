-- Migration: Billing hardening — CHECK constraints, RLS optimization, indexes.

-- ─── CHECK constraints on monetary columns ──────────────────────────────────

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_subtotal_non_negative    CHECK (subtotal >= 0),
  ADD CONSTRAINT invoices_tax_amount_non_negative  CHECK (tax_amount >= 0),
  ADD CONSTRAINT invoices_total_non_negative       CHECK (total >= 0),
  ADD CONSTRAINT invoices_amount_paid_non_negative CHECK (amount_paid >= 0),
  ADD CONSTRAINT invoices_tax_rate_range           CHECK (tax_rate BETWEEN 0 AND 1),
  ADD CONSTRAINT invoices_amount_paid_lte_total    CHECK (amount_paid <= total);

ALTER TABLE public.invoice_items
  ADD CONSTRAINT invoice_items_quantity_positive   CHECK (quantity > 0),
  ADD CONSTRAINT invoice_items_unit_price_non_neg  CHECK (unit_price >= 0),
  ADD CONSTRAINT invoice_items_total_non_negative  CHECK (total >= 0);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);

-- ─── RLS optimization: wrap function calls in (SELECT ...) for plan caching ─

-- Invoices: drop and recreate hospital staff policy
DROP POLICY IF EXISTS "hospital_staff_manage_invoices" ON public.invoices;
CREATE POLICY "hospital_staff_manage_invoices"
  ON public.invoices FOR ALL
  USING (hospital_id = (SELECT public.my_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.my_hospital_id()));

DROP POLICY IF EXISTS "platform_admin_all_invoices" ON public.invoices;
CREATE POLICY "platform_admin_all_invoices"
  ON public.invoices FOR ALL
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

-- Invoice items: drop and recreate
DROP POLICY IF EXISTS "hospital_staff_manage_invoice_items" ON public.invoice_items;
CREATE POLICY "hospital_staff_manage_invoice_items"
  ON public.invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE hospital_id = (SELECT public.my_hospital_id())
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE hospital_id = (SELECT public.my_hospital_id())
    )
  );

DROP POLICY IF EXISTS "platform_admin_all_invoice_items" ON public.invoice_items;
CREATE POLICY "platform_admin_all_invoice_items"
  ON public.invoice_items FOR ALL
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

-- Payments: drop and recreate
DROP POLICY IF EXISTS "hospital_staff_manage_payments" ON public.payments;
CREATE POLICY "hospital_staff_manage_payments"
  ON public.payments FOR ALL
  USING (hospital_id = (SELECT public.my_hospital_id()))
  WITH CHECK (hospital_id = (SELECT public.my_hospital_id()));

DROP POLICY IF EXISTS "platform_admin_all_payments" ON public.payments;
CREATE POLICY "platform_admin_all_payments"
  ON public.payments FOR ALL
  USING ((SELECT public.is_platform_admin()))
  WITH CHECK ((SELECT public.is_platform_admin()));

-- ─── Additional indexes ─────────────────────────────────────────────────────

-- Partial indexes on nullable FK columns
CREATE INDEX IF NOT EXISTS invoices_admission_id_idx
  ON public.invoices (admission_id) WHERE admission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_appointment_id_idx
  ON public.invoices (appointment_id) WHERE appointment_id IS NOT NULL;

-- Composite index for payment history queries (ORDER BY paid_at DESC)
CREATE INDEX IF NOT EXISTS payments_invoice_paid_at_idx
  ON public.payments (invoice_id, paid_at DESC);
