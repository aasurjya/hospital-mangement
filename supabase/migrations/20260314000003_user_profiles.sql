-- Migration: User profiles table with hospital scoping
-- Links Supabase Auth users to application roles and hospital membership.
-- Idempotent: uses IF NOT EXISTS patterns

create table if not exists public.user_profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  hospital_id   uuid references public.hospitals (id) on delete set null,
  role          public.app_role not null,
  full_name     text not null,
  display_name  text,
  phone         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes
create index if not exists user_profiles_hospital_id_idx on public.user_profiles (hospital_id);
create index if not exists user_profiles_role_idx on public.user_profiles (role);

-- Updated_at trigger
drop trigger if exists user_profiles_updated_at on public.user_profiles;
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Helper: check if the calling user is a platform admin
create or replace function public.is_platform_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid()
      and role = 'PLATFORM_ADMIN'
  );
$$;

-- Helper: get the hospital_id of the calling user
create or replace function public.my_hospital_id()
returns uuid language sql security definer stable as $$
  select hospital_id from public.user_profiles
  where id = auth.uid();
$$;

-- RLS Policies for user_profiles -----------------------------------------------

-- Platform admin: full access to all profiles
create policy "platform_admin_all_profiles"
  on public.user_profiles
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Users can read their own profile
create policy "own_profile_select"
  on public.user_profiles
  for select
  using (id = auth.uid());

-- Hospital admin: read profiles within their hospital
create policy "hospital_admin_read_hospital_profiles"
  on public.user_profiles
  for select
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'HOSPITAL_ADMIN'
        and up.hospital_id = public.user_profiles.hospital_id
    )
  );

-- Hospital admin: insert profiles into their hospital
create policy "hospital_admin_insert_hospital_profiles"
  on public.user_profiles
  for insert
  with check (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'HOSPITAL_ADMIN'
        and up.hospital_id = public.user_profiles.hospital_id
    )
  );

-- Hospital admin: update profiles within their hospital (cannot escalate to PLATFORM_ADMIN)
create policy "hospital_admin_update_hospital_profiles"
  on public.user_profiles
  for update
  using (
    hospital_id = public.my_hospital_id()
    and exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'HOSPITAL_ADMIN'
        and up.hospital_id = public.user_profiles.hospital_id
    )
  )
  with check (
    role <> 'PLATFORM_ADMIN'
  );

-- RLS Policies for hospitals ----------------------------------------------------

-- Platform admin: full access
create policy "platform_admin_all_hospitals"
  on public.hospitals
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Hospital admin / staff: read their own hospital record
create policy "hospital_member_read_own_hospital"
  on public.hospitals
  for select
  using (
    id = public.my_hospital_id()
  );
