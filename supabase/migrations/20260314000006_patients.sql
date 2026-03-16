-- Migration: Patients registry
-- Patients are clinical records scoped per hospital.
-- Not linked to auth.users in Phase 3 (patients don't log in yet).
-- Idempotent.

-- Gender enum
do $$ begin
  create type public.patient_gender as enum (
    'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'
  );
exception when duplicate_object then null;
end $$;

-- Blood type enum
do $$ begin
  create type public.blood_type as enum (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.patients (
  id                        uuid primary key default extensions.uuid_generate_v4(),
  hospital_id               uuid not null references public.hospitals (id) on delete cascade,
  -- Medical record number: unique per hospital, format MRN-{year}-{seq}
  mrn                       text not null,
  full_name                 text not null,
  date_of_birth             date,
  gender                    public.patient_gender,
  blood_type                public.blood_type default 'UNKNOWN',
  phone                     text,
  email                     text,
  address                   text,
  emergency_contact_name    text,
  emergency_contact_phone   text,
  insurance_provider        text,
  insurance_number          text,
  is_active                 boolean not null default true,
  created_by                uuid references auth.users (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create unique index if not exists patients_hospital_mrn_idx
  on public.patients (hospital_id, mrn);

create index if not exists patients_hospital_id_idx
  on public.patients (hospital_id);

create index if not exists patients_full_name_idx
  on public.patients using gin (to_tsvector('english', full_name));

drop trigger if exists patients_updated_at on public.patients;
create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

alter table public.patients enable row level security;

-- Platform admin: full access
create policy "platform_admin_all_patients"
  on public.patients for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Hospital staff: read and write patients in their hospital
create policy "hospital_staff_manage_patients"
  on public.patients for all
  using (hospital_id = public.my_hospital_id())
  with check (hospital_id = public.my_hospital_id());
