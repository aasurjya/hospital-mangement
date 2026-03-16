-- Migration: messages table + realtime + last_message_at trigger
-- Soft-delete via deleted_at. Cursor-paginated by (created_at DESC, id DESC).
-- Hard DELETE is intentionally disallowed via RLS (no DELETE policy).
-- sender_id is nullable (set null on user deletion) — this is intentional for message history.
-- Idempotent.

create table if not exists public.messages (
  id              uuid primary key default extensions.uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid references auth.users(id) on delete set null,
  hospital_id     uuid not null references public.hospitals(id) on delete cascade,
  content         text,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);

-- Composite cursor-pagination index; partial on non-deleted rows to skip soft-deleted messages
-- efficiently in get_unread_counts and message list queries.
create index if not exists messages_conversation_cursor_idx
  on public.messages (conversation_id, created_at desc, id desc)
  where deleted_at is null;
-- Index for full scan (including deleted) when needed, e.g. admin audit views
create index if not exists messages_conversation_all_idx
  on public.messages (conversation_id, created_at desc);
create index if not exists messages_hospital_id_idx
  on public.messages (hospital_id);
create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

-- Trigger: keep conversations.last_message_at up to date.
-- Uses GREATEST() so out-of-order inserts (backfill, import) never rewind the timestamp.
create or replace function public.update_conversation_last_message_at()
returns trigger language plpgsql security definer as $$
begin
  update public.conversations
  set last_message_at = greatest(last_message_at, NEW.created_at)
  where id = NEW.conversation_id;
  return NEW;
end;
$$;

drop trigger if exists messages_update_conversation_ts on public.messages;
create trigger messages_update_conversation_ts
  after insert on public.messages
  for each row execute function public.update_conversation_last_message_at();

alter table public.messages enable row level security;

-- SELECT: hospital member + conversation member.
-- (SELECT auth.uid()) evaluated once per statement.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages for select
  using (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and conversation_id in (
      select conversation_id from public.conversation_members
      where user_id = (SELECT auth.uid())
    )
  );

-- INSERT: must be conversation member, sender = self.
-- WITH CHECK is the authoritative insert guard; USING not applicable for INSERT.
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert"
  on public.messages for insert
  with check (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and sender_id = (SELECT auth.uid())
    and conversation_id in (
      select conversation_id from public.conversation_members
      where user_id = (SELECT auth.uid())
    )
  );

-- UPDATE: sender soft-deletes own, HOSPITAL_ADMIN soft-deletes any.
-- WITH CHECK mirrors USING to prevent reassigning hospital_id or conversation_id.
drop policy if exists "messages_update" on public.messages;
create policy "messages_update"
  on public.messages for update
  using (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and (
      sender_id = (SELECT auth.uid())
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'HOSPITAL_ADMIN'
    )
  )
  with check (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and conversation_id in (
      select conversation_id from public.conversation_members
      where user_id = (SELECT auth.uid())
    )
  );

-- Enable Realtime for live message delivery and membership updates.
-- ALTER PUBLICATION ADD TABLE is not idempotent; guard with a DO block.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversation_members;
exception when duplicate_object then null;
end $$;
