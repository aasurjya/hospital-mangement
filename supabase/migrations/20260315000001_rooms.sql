-- Migration: Rooms table for hospital room/bed management
-- Idempotent.

-- Room type enum
do $$ begin
  create type public.room_type as enum (
    'GENERAL', 'PRIVATE', 'SEMI_PRIVATE', 'ICU', 'NICU', 'EMERGENCY', 'OPERATION_THEATRE', 'ISOLATION'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.rooms (
  id              uuid primary key default extensions.uuid_generate_v4(),
  hospital_id     uuid not null references public.hospitals (id) on delete cascade,
  room_number     text not null,
  room_type       public.room_type not null default 'GENERAL',
  floor           text,
  is_available    boolean not null default true,
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Unique room number per hospital
create unique index if not exists rooms_hospital_room_number_idx on public.rooms (hospital_id, room_number);
create index if not exists rooms_hospital_id_idx on public.rooms (hospital_id);
create index if not exists rooms_available_idx on public.rooms (hospital_id, is_available) where is_active = true;

drop trigger if exists rooms_updated_at on public.rooms;
create trigger rooms_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;

create policy "platform_admin_all_rooms"
  on public.rooms for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "hospital_staff_manage_rooms"
  on public.rooms for all
  using (hospital_id = public.my_hospital_id())
  with check (hospital_id = public.my_hospital_id());

-- Add room_id to admissions
do $$ begin
  alter table public.admissions add column room_id uuid references public.rooms (id) on delete set null;
exception when duplicate_column then null;
end $$;

create index if not exists admissions_room_id_idx on public.admissions (room_id);
