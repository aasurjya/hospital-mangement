-- Migration: Appointments and Admissions
-- Idempotent.

-- Appointment status enum
do $$ begin
  create type public.appointment_status as enum (
    'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
  );
exception when duplicate_object then null;
end $$;

-- Admission status enum
do $$ begin
  create type public.admission_status as enum (
    'ADMITTED', 'DISCHARGED', 'TRANSFERRED'
  );
exception when duplicate_object then null;
end $$;

-- ─── Appointments ────────────────────────────────────────────────────────────

create table if not exists public.appointments (
  id              uuid primary key default extensions.uuid_generate_v4(),
  hospital_id     uuid not null references public.hospitals (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  doctor_id       uuid references public.user_profiles (id) on delete set null,
  department_id   uuid references public.departments (id) on delete set null,
  scheduled_at    timestamptz not null,
  duration_minutes integer not null default 30,
  status          public.appointment_status not null default 'SCHEDULED',
  reason          text,
  notes           text,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists appointments_hospital_id_idx  on public.appointments (hospital_id);
create index if not exists appointments_patient_id_idx   on public.appointments (patient_id);
create index if not exists appointments_doctor_id_idx    on public.appointments (doctor_id);
create index if not exists appointments_scheduled_at_idx on public.appointments (hospital_id, scheduled_at desc);

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

create policy "platform_admin_all_appointments"
  on public.appointments for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "hospital_staff_manage_appointments"
  on public.appointments for all
  using (hospital_id = public.my_hospital_id())
  with check (hospital_id = public.my_hospital_id());

-- ─── Admissions ──────────────────────────────────────────────────────────────

create table if not exists public.admissions (
  id              uuid primary key default extensions.uuid_generate_v4(),
  hospital_id     uuid not null references public.hospitals (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  doctor_id       uuid references public.user_profiles (id) on delete set null,
  department_id   uuid references public.departments (id) on delete set null,
  admitted_at     timestamptz not null default now(),
  discharged_at   timestamptz,
  status          public.admission_status not null default 'ADMITTED',
  reason          text,
  notes           text,
  bed_number      text,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists admissions_hospital_id_idx on public.admissions (hospital_id);
create index if not exists admissions_patient_id_idx  on public.admissions (patient_id);
create index if not exists admissions_status_idx      on public.admissions (hospital_id, status);
create index if not exists admissions_admitted_at_idx on public.admissions (hospital_id, admitted_at desc);

drop trigger if exists admissions_updated_at on public.admissions;
create trigger admissions_updated_at
  before update on public.admissions
  for each row execute function public.set_updated_at();

alter table public.admissions enable row level security;

create policy "platform_admin_all_admissions"
  on public.admissions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "hospital_staff_manage_admissions"
  on public.admissions for all
  using (hospital_id = public.my_hospital_id())
  with check (hospital_id = public.my_hospital_id());
