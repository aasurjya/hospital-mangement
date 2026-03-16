-- Migration: Add room audit event types
-- Idempotent via IF NOT EXISTS.

alter type public.audit_event_type add value if not exists 'ROOM_CREATED';
alter type public.audit_event_type add value if not exists 'ROOM_UPDATED';
