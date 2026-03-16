-- Migration: message_attachments table + chat-attachments Storage bucket
-- Files uploaded client-side to Storage, then referenced here after message insert.
-- Path format: <hospital_id>/<conversation_id>/<message_id>/<uuid>_<filename>
-- Idempotent.

create table if not exists public.message_attachments (
  id           uuid primary key default extensions.uuid_generate_v4(),
  message_id   uuid not null references public.messages(id) on delete cascade,
  hospital_id  uuid not null references public.hospitals(id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  -- bigint: consistent with best-practices (integer caps at ~2 GB; bigint is future-proof)
  file_size    bigint not null,
  mime_type    text not null,
  created_at   timestamptz not null default now()
);

create index if not exists message_attachments_message_id_idx
  on public.message_attachments (message_id);
create index if not exists message_attachments_hospital_id_idx
  on public.message_attachments (hospital_id);

alter table public.message_attachments enable row level security;

-- SELECT: must be member of the conversation that owns the message.
-- Hospital filter pushed into the inner subquery to prune rows before the join.
-- (SELECT auth.uid()) evaluated once per statement, not per row.
drop policy if exists "message_attachments_select" on public.message_attachments;
create policy "message_attachments_select"
  on public.message_attachments for select
  using (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and message_id in (
      select m.id from public.messages m
      where m.hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
        and m.conversation_id in (
          select conversation_id from public.conversation_members
          where user_id = (SELECT auth.uid())
        )
    )
  );

-- INSERT: inserting user must be the sender of the referenced message.
-- This prevents a hospital member from attaching files to another user's messages.
drop policy if exists "message_attachments_insert" on public.message_attachments;
create policy "message_attachments_insert"
  on public.message_attachments for insert
  with check (
    hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    and exists (
      select 1 from public.messages m
      where m.id = message_id
        and m.sender_id = (SELECT auth.uid())
        and m.hospital_id = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')::uuid
    )
  );

-- Storage: chat-attachments private bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Storage policies: scope by hospital_id (path segment 1) AND conversation_id
-- (path segment 2) to ensure a user can only access files for conversations
-- they are a member of.
-- DROP IF EXISTS for idempotency (storage policies have no IF NOT EXISTS syntax).
drop policy if exists "chat_attachments_select" on storage.objects;
create policy "chat_attachments_select"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = (storage.foldername(name))[2]::uuid
        and cm.user_id = (SELECT auth.uid())
    )
  );

drop policy if exists "chat_attachments_insert" on storage.objects;
create policy "chat_attachments_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'hospital_id')
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = (storage.foldername(name))[2]::uuid
        and cm.user_id = (SELECT auth.uid())
    )
  );
