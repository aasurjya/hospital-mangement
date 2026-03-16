-- Migration: conversation_type enum
-- Idempotent.
do $$ begin
  create type public.conversation_type as enum ('DIRECT', 'GROUP', 'BROADCAST');
exception when duplicate_object then null;
end $$;
