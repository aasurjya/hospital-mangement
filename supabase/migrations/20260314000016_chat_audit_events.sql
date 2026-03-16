-- Migration: chat audit event types + get_unread_counts RPC
-- Idempotent.

do $$ begin alter type public.audit_event_type add value if not exists 'CONVERSATION_CREATED'; exception when others then null; end $$;
do $$ begin alter type public.audit_event_type add value if not exists 'CONVERSATION_UPDATED'; exception when others then null; end $$;
do $$ begin alter type public.audit_event_type add value if not exists 'MEMBER_ADDED'; exception when others then null; end $$;
do $$ begin alter type public.audit_event_type add value if not exists 'MEMBER_REMOVED'; exception when others then null; end $$;
do $$ begin alter type public.audit_event_type add value if not exists 'MESSAGE_DELETED'; exception when others then null; end $$;
do $$ begin alter type public.audit_event_type add value if not exists 'ATTACHMENT_UPLOADED'; exception when others then null; end $$;

-- Returns unread message counts per conversation for the calling user only.
-- SECURITY DEFINER bypasses RLS for accurate counts, but the function ignores
-- the p_user_id parameter and always operates on auth.uid() to prevent any
-- authenticated user from querying another user's unread counts.
-- SET search_path guards against search-path injection on SECURITY DEFINER functions.
-- Own messages are excluded: a sender's own messages are never counted as unread.
create or replace function public.get_unread_counts(p_user_id uuid)
returns table(conversation_id uuid, unread_count bigint)
language sql security definer stable
set search_path = public, pg_temp
as $$
  select
    cm.conversation_id,
    count(m.id) as unread_count
  from public.conversation_members cm
  left join public.messages m
    on m.conversation_id = cm.conversation_id
    and m.created_at > cm.last_read_at
    and m.deleted_at is null
    and m.sender_id <> auth.uid()  -- own messages are not unread
  -- Always use auth.uid() — never the caller-supplied p_user_id — so that no
  -- authenticated user can enumerate another user's conversation membership.
  where cm.user_id = auth.uid()
  group by cm.conversation_id;
$$;

-- Grant execute to authenticated role so clients can invoke this RPC.
grant execute on function public.get_unread_counts(uuid) to authenticated;
