-- Migration: Audit logs table
-- Required for: user creation, password resets, role changes, and future events.
-- Idempotent: uses IF NOT EXISTS

-- Audit event type enum
do $$ begin
  create type public.audit_event_type as enum (
    'USER_CREATED',
    'USER_DEACTIVATED',
    'USER_REACTIVATED',
    'PASSWORD_RESET',
    'ROLE_CHANGED',
    'HOSPITAL_CREATED',
    'HOSPITAL_UPDATED',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGOUT'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.audit_logs (
  id            uuid primary key default extensions.uuid_generate_v4(),
  -- hospital context (null for platform-level events)
  hospital_id   uuid references public.hospitals (id) on delete set null,
  -- actor: who performed the action
  actor_id      uuid references auth.users (id) on delete set null,
  actor_role    public.app_role,
  -- subject: who was affected (may be null for non-user events)
  subject_id    uuid references auth.users (id) on delete set null,
  -- event
  event_type    public.audit_event_type not null,
  description   text,
  -- structured metadata (previous state, new state, ip, etc.)
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- Indexes for efficient audit queries
create index if not exists audit_logs_hospital_id_idx  on public.audit_logs (hospital_id);
create index if not exists audit_logs_actor_id_idx     on public.audit_logs (actor_id);
create index if not exists audit_logs_subject_id_idx   on public.audit_logs (subject_id);
create index if not exists audit_logs_event_type_idx   on public.audit_logs (event_type);
create index if not exists audit_logs_created_at_idx   on public.audit_logs (created_at desc);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Platform admin: full read access to all audit logs
create policy "platform_admin_read_all_audit_logs"
  on public.audit_logs
  for select
  using (public.is_platform_admin());

-- Hospital admin: read audit logs for their hospital
create policy "hospital_admin_read_hospital_audit_logs"
  on public.audit_logs
  for select
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'HOSPITAL_ADMIN'
        and up.hospital_id = public.audit_logs.hospital_id
    )
  );

-- Only server-side (service role) can insert audit logs — no client insert policy.
-- This is enforced by using the service role key in server actions only.

-- Helper function: insert an audit log entry (callable from server-side RPC only)
create or replace function public.insert_audit_log(
  p_hospital_id   uuid,
  p_actor_id      uuid,
  p_actor_role    public.app_role,
  p_subject_id    uuid,
  p_event_type    public.audit_event_type,
  p_description   text,
  p_metadata      jsonb default '{}'
)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (
    hospital_id, actor_id, actor_role, subject_id,
    event_type, description, metadata
  ) values (
    p_hospital_id, p_actor_id, p_actor_role, p_subject_id,
    p_event_type, p_description, p_metadata
  ) returning id into v_id;
  return v_id;
end;
$$;
