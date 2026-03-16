-- Migration: conversations table
-- Hospital-scoped chat threads: DIRECT (1:1), GROUP (named), BROADCAST (admin-only send).
-- RLS uses JWT app_metadata to avoid recursion.
-- Idempotent.

create table if not exists public.conversations (
  id             uuid primary key default extensions.uuid_generate_v4(),
  hospital_id    uuid not null references public.hospitals(id) on delete cascade,
  type           public.conversation_type not null,
  name           text,
  description    text,
  created_by     uuid references auth.users(id) on delete set null,
  allowed_roles  public.app_role[],          -- BROADCAST only: which roles can see it (null = all staff)
  last_message_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists conversations_hospital_last_message_idx
  on public.conversations (hospital_id, last_message_at desc nulls last);
create index if not exists conversations_hospital_type_idx
  on public.conversations (hospital_id, type);
-- Index for UPDATE policy predicate (created_by = auth.uid()) and FK integrity
create index if not exists conversations_created_by_idx
  on public.conversations (created_by);

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

-- SELECT policy depends on conversation_members table — deferred to 20260314000013.

-- INSERT: hospital staff only; BROADCAST restricted to HOSPITAL_ADMIN
drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert"
  on public.conversations for insert
  with check (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and (
      type <> 'BROADCAST'
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
    )
  );

-- UPDATE: creator or HOSPITAL_ADMIN.
-- WITH CHECK mirrors USING to prevent moving a conversation to another hospital.
drop policy if exists "conversations_update" on public.conversations;
create policy "conversations_update"
  on public.conversations for update
  using (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and (
      created_by = (SELECT auth.uid())
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
    )
  )
  with check (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
  );

-- DELETE: HOSPITAL_ADMIN only.
-- Hard deletes cascade to conversation_members and messages via FK ON DELETE CASCADE.
drop policy if exists "conversations_delete" on public.conversations;
create policy "conversations_delete"
  on public.conversations for delete
  using (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
  );
