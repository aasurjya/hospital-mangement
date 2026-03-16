-- Migration: Add billing audit event types.

alter type public.audit_event_type add value if not exists 'INVOICE_CREATED';
alter type public.audit_event_type add value if not exists 'INVOICE_ISSUED';
alter type public.audit_event_type add value if not exists 'INVOICE_VOIDED';
alter type public.audit_event_type add value if not exists 'PAYMENT_RECORDED';
