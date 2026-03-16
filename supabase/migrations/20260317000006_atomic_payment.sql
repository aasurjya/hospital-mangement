-- Atomic payment recording to prevent TOCTOU race conditions
CREATE OR REPLACE FUNCTION public.record_payment(
  p_invoice_id uuid,
  p_hospital_id uuid,
  p_amount numeric,
  p_method payment_method,
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_recorded_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total numeric;
  v_amount_paid numeric;
  v_balance numeric;
  v_status invoice_status;
  v_new_amount_paid numeric;
  v_new_status invoice_status;
  v_payment_id uuid;
BEGIN
  -- Lock the invoice row to prevent concurrent modifications
  SELECT total, amount_paid, status
  INTO v_total, v_amount_paid, v_status
  FROM invoices
  WHERE id = p_invoice_id AND hospital_id = p_hospital_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invoice not found.');
  END IF;

  IF v_status = 'VOID' THEN
    RETURN jsonb_build_object('error', 'Cannot record payment on a voided invoice.');
  END IF;

  IF v_status = 'DRAFT' THEN
    RETURN jsonb_build_object('error', 'Issue the invoice before recording payments.');
  END IF;

  IF v_status = 'PAID' THEN
    RETURN jsonb_build_object('error', 'Invoice is already fully paid.');
  END IF;

  v_balance := ROUND(v_total - v_amount_paid, 2);

  IF p_amount > v_balance THEN
    RETURN jsonb_build_object('error', format('Amount exceeds balance due (%s).', v_balance));
  END IF;

  -- Insert payment
  INSERT INTO payments (invoice_id, hospital_id, amount, method, reference, notes, recorded_by)
  VALUES (p_invoice_id, p_hospital_id, p_amount, p_method, p_reference, p_notes, p_recorded_by)
  RETURNING id INTO v_payment_id;

  -- Update invoice atomically
  v_new_amount_paid := ROUND(v_amount_paid + p_amount, 2);
  v_new_status := CASE WHEN v_new_amount_paid >= v_total THEN 'PAID'::invoice_status ELSE 'PARTIAL'::invoice_status END;

  UPDATE invoices
  SET amount_paid = v_new_amount_paid, status = v_new_status
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'new_amount_paid', v_new_amount_paid,
    'new_status', v_new_status
  );
END;
$$;

COMMENT ON FUNCTION public.record_payment IS 'Atomically record a payment and update invoice balance. Uses row-level locking to prevent race conditions.';
