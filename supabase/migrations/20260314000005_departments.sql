-- Migration: Departments
-- Each department belongs to a hospital and optionally has a head doctor.
-- Idempotent.

create table if not exists public.departments (
  id            uuid primary key default extensions.uuid_generate_v4(),
  hospital_id   uuid not null references public.hospitals (id) on delete cascade,
  name          text not null,
  description   text,
  head_doctor_id uuid references public.user_profiles (id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists departments_hospital_name_idx
  on public.departments (hospital_id, lower(name));

create index if not exists departments_hospital_id_idx
  on public.departments (hospital_id);

drop trigger if exists departments_updated_at on public.departments;
create trigger departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

alter table public.departments enable row level security;

-- Platform admin: full access
create policy "platform_admin_all_departments"
  on public.departments for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Hospital admin: manage departments in their hospital
create policy "hospital_admin_manage_departments"
  on public.departments for all
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'HOSPITAL_ADMIN'
    )
  )
  with check (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'HOSPITAL_ADMIN'
    )
  );

-- All hospital staff: read active departments in their hospital
create policy "hospital_staff_read_departments"
  on public.departments for select
  using (
    hospital_id = public.my_hospital_id()
    and is_active = true
  );
