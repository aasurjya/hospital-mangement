-- Migration: Role enum, hospitals table
-- Idempotent: uses IF NOT EXISTS and DO $$ patterns

-- Role enum
do $$ begin
  create type public.app_role as enum (
    'PLATFORM_ADMIN',
    'HOSPITAL_ADMIN',
    'DOCTOR',
    'NURSE',
    'RECEPTIONIST',
    'LAB_TECHNICIAN',
    'PHARMACIST',
    'BILLING_STAFF',
    'ACCOUNTANT',
    'HR_MANAGER',
    'OPERATIONS_MANAGER',
    'PATIENT'
  );
exception when duplicate_object then null;
end $$;

-- Hospitals table
create table if not exists public.hospitals (
  id          uuid primary key default extensions.uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  address     text,
  phone       text,
  email       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for slug lookups
create index if not exists hospitals_slug_idx on public.hospitals (slug);

-- Updated_at trigger function (shared)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach updated_at trigger to hospitals
drop trigger if exists hospitals_updated_at on public.hospitals;
create trigger hospitals_updated_at
  before update on public.hospitals
  for each row execute function public.set_updated_at();

-- RLS: platform admin can see all hospitals; no public access
alter table public.hospitals enable row level security;

-- Platform admins (identified by custom claim in user_profiles) can do everything.
-- Individual hospital policies are managed after user_profiles table exists.
-- For now, allow authenticated service-role access only (policies added in migration 3).
