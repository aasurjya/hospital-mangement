-- Seed: Platform admin user
-- The platform admin is bootstrapped via environment variable PLATFORM_ADMIN_EMAIL.
-- This seed creates the auth user and user_profile for local development.
-- In production, use the bootstrap script (scripts/bootstrap-platform-admin.ts).

-- NOTE: Supabase local seed runs after migrations.
-- We use a fixed dev password here. NEVER use this password in production.

-- Bypass RLS for seed inserts
set local role postgres;

do $$
declare
  v_admin_email text := 'corp.asurjya@gmail.com';
  v_admin_password text := 'DevAdmin@2026!';
  v_user_id uuid;
begin
  -- Check if platform admin already exists
  select id into v_user_id
  from auth.users
  where email = v_admin_email;

  if v_user_id is null then
    -- Create Supabase auth user
    v_user_id := extensions.uuid_generate_v4();

    insert into auth.users (
      id,
      instance_id,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      now(),
      now(),
      '{"provider": "email", "providers": ["email"], "role": "PLATFORM_ADMIN", "hospital_id": null}',
      '{"full_name": "Platform Admin"}',
      false,
      'authenticated'
    );

    -- Create user_profile for platform admin (no hospital)
    insert into public.user_profiles (
      id,
      hospital_id,
      role,
      full_name,
      is_active
    ) values (
      v_user_id,
      null,
      'PLATFORM_ADMIN',
      'Platform Admin',
      true
    );

    raise notice 'Platform admin created: %', v_admin_email;
  else
    raise notice 'Platform admin already exists: %', v_admin_email;
  end if;
end $$;
