-- Migration: conversation_members table
-- Tracks which users belong to which conversations + their last_read_at for unread counts.
-- SELECT policy is intentionally simple (own rows only) to break potential RLS cycles.
-- Member lists for UI are fetched via service role in server actions.
-- Idempotent.

create table if not exists public.conversation_members (
  id              uuid primary key default extensions.uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  joined_at       timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create index if not exists conversation_members_user_id_idx
  on public.conversation_members (user_id);
create index if not exists conversation_members_conversation_id_idx
  on public.conversation_members (conversation_id);

alter table public.conversation_members enable row level security;

-- SELECT: own membership rows only — simple, no subqueries, breaks RLS cycles.
-- (SELECT auth.uid()) evaluated once per statement.
drop policy if exists "conversation_members_select" on public.conversation_members;
create policy "conversation_members_select"
  on public.conversation_members for select
  using (user_id = (SELECT auth.uid()));

-- INSERT: requester must be in the same hospital as the conversation, AND must
-- themselves be a member of that conversation OR be a HOSPITAL_ADMIN.
-- This prevents arbitrary users from adding themselves to conversations they
-- were not invited to.
drop policy if exists "conversation_members_insert" on public.conversation_members;
create policy "conversation_members_insert"
  on public.conversation_members for insert
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid = (
      select hospital_id from public.conversations c where c.id = conversation_id
    )
    and (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
      or exists (
        select 1 from public.conversation_members existing
        where existing.conversation_id = conversation_members.conversation_id
          and existing.user_id = (SELECT auth.uid())
      )
    )
  );

-- UPDATE: users update their own last_read_at only.
-- WITH CHECK ensures user_id cannot be reassigned after the USING check passes.
drop policy if exists "conversation_members_update" on public.conversation_members;
create policy "conversation_members_update"
  on public.conversation_members for update
  using (user_id = (SELECT auth.uid()))
  with check (user_id = (SELECT auth.uid()));

-- DELETE: user can leave, or HOSPITAL_ADMIN can remove any member
drop policy if exists "conversation_members_delete" on public.conversation_members;
create policy "conversation_members_delete"
  on public.conversation_members for delete
  using (
    user_id = (SELECT auth.uid())
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
  );

-- Deferred from 20260314000012: conversations SELECT policy
-- (depends on conversation_members existing)
drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations for select
  using (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and (
      id in (
        select conversation_id
        from public.conversation_members
        where user_id = (SELECT auth.uid())
      )
      or type = 'BROADCAST'
    )
  );
