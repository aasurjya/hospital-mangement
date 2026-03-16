-- Migration: Medical records shell
-- Clinician-authored records scoped by hospital and patient.
-- AI writes are NEVER allowed here directly — this is the authoritative clinical record.
-- Idempotent.

do $$ begin
  create type public.record_status as enum ('DRAFT', 'FINALIZED');
exception when duplicate_object then null;
end $$;

create table if not exists public.medical_records (
  id                uuid primary key default extensions.uuid_generate_v4(),
  hospital_id       uuid not null references public.hospitals (id) on delete cascade,
  patient_id        uuid not null references public.patients (id) on delete cascade,
  -- The clinician who authored the record
  author_id         uuid references public.user_profiles (id) on delete set null,
  -- Linked admission if this record was created during an inpatient stay
  admission_id      uuid references public.admissions (id) on delete set null,
  -- Linked appointment if this was an outpatient visit
  appointment_id    uuid references public.appointments (id) on delete set null,
  visit_date        date not null default current_date,
  chief_complaint   text,
  notes             text,
  status            public.record_status not null default 'DRAFT',
  -- Finalization
  finalized_by      uuid references public.user_profiles (id) on delete set null,
  finalized_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists medical_records_hospital_id_idx  on public.medical_records (hospital_id);
create index if not exists medical_records_patient_id_idx   on public.medical_records (patient_id);
create index if not exists medical_records_author_id_idx    on public.medical_records (author_id);
create index if not exists medical_records_visit_date_idx   on public.medical_records (hospital_id, visit_date desc);

drop trigger if exists medical_records_updated_at on public.medical_records;
create trigger medical_records_updated_at
  before update on public.medical_records
  for each row execute function public.set_updated_at();

alter table public.medical_records enable row level security;

-- Platform admin: full read (no write — must go through clinical workflow)
create policy "platform_admin_read_medical_records"
  on public.medical_records for select
  using (public.is_platform_admin());

-- Hospital admin: read all records in their hospital
create policy "hospital_admin_read_medical_records"
  on public.medical_records for select
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'HOSPITAL_ADMIN'
    )
  );

-- Doctors: full access to records in their hospital
create policy "doctor_manage_medical_records"
  on public.medical_records for all
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'DOCTOR'
    )
  )
  with check (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'DOCTOR'
    )
  );

-- Nurses: read records in their hospital
create policy "nurse_read_medical_records"
  on public.medical_records for select
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'NURSE'
    )
  );
