-- Migration: Fix infinite RLS recursion on user_profiles
-- Root cause: policies on user_profiles called is_platform_admin() which SELECT-ed from
-- user_profiles again, triggering the same policies → infinite recursion.
-- Fix: replace user_profiles policies with JWT app_metadata checks (no table lookup),
-- and add a trigger to keep raw_app_meta_data in sync with user_profiles.role/hospital_id.

-- 1. Trigger function: sync role + hospital_id to auth.users.raw_app_meta_data
create or replace function public.sync_user_profile_to_jwt()
returns trigger language plpgsql security definer as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', NEW.role::text,
      'hospital_id', NEW.hospital_id::text
    )
  where id = NEW.id;
  return NEW;
end;
$$;

drop trigger if exists user_profiles_sync_jwt on public.user_profiles;
create trigger user_profiles_sync_jwt
  after insert or update of role, hospital_id
  on public.user_profiles
  for each row execute function public.sync_user_profile_to_jwt();

-- 2. Backfill all existing users
update auth.users au
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role', up.role::text,
    'hospital_id', up.hospital_id::text
  )
from public.user_profiles up
where au.id = up.id;

-- 3. Drop old recursive policies on user_profiles
drop policy if exists "platform_admin_all_profiles"              on public.user_profiles;
drop policy if exists "hospital_admin_read_hospital_profiles"    on public.user_profiles;
drop policy if exists "hospital_admin_insert_hospital_profiles"  on public.user_profiles;
drop policy if exists "hospital_admin_update_hospital_profiles"  on public.user_profiles;

-- 4. Recreate policies using JWT (no user_profiles subqueries → no recursion)

-- Platform admin: full access via JWT role claim
create policy "platform_admin_all_profiles"
  on public.user_profiles for all
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'PLATFORM_ADMIN')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'PLATFORM_ADMIN');

-- Hospital admin: read profiles in their hospital via JWT
create policy "hospital_admin_read_hospital_profiles"
  on public.user_profiles for select
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
    and hospital_id = ((auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid)
  );

-- Hospital admin: insert into their hospital via JWT
create policy "hospital_admin_insert_hospital_profiles"
  on public.user_profiles for insert
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
    and hospital_id = ((auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid)
  );

-- Hospital admin: update profiles in their hospital (cannot escalate to PLATFORM_ADMIN)
create policy "hospital_admin_update_hospital_profiles"
  on public.user_profiles for update
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
    and hospital_id = ((auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid)
  )
  with check (role <> 'PLATFORM_ADMIN');
