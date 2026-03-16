'use server'

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { createConversationSchema, sendMessageSchema, addMemberSchema, attachmentPayloadArraySchema } from '@/lib/chat/schemas'
import { CHAT_BUCKET } from '@/lib/chat/constants'

// ---------------------------------------------------------------------------
// State types (used with React 19 useActionState)
// ---------------------------------------------------------------------------

export type ConversationState = { error?: string; fieldErrors?: Record<string, string[]> } | null
export type MessageState = { error?: string; messageId?: string } | null
export type MemberState = { error?: string } | null

// ---------------------------------------------------------------------------
// Attachment payload shape parsed from the `attachment_paths` JSON field
// ---------------------------------------------------------------------------

interface AttachmentPayload {
  storagePath: string
  fileName: string
  fileSize: number
  mimeType: string
}

// ---------------------------------------------------------------------------
// createConversationAction
// ---------------------------------------------------------------------------

/**
 * Creates a new conversation and adds all initial members.
 * For DIRECT conversations, deduplicates — redirects to the existing conversation
 * if one already exists between the two users.
 */
export async function createConversationAction(
  _prev: ConversationState,
  formData: FormData
): Promise<ConversationState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id
  if (!hospitalId) return { error: 'No hospital assigned to your account.' }

  const rawMemberIds = formData.get('member_ids')
  const parsedMemberIds: string[] = rawMemberIds
    ? String(rawMemberIds)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const parsed = createConversationSchema.safeParse({
    type: formData.get('type'),
    name: (formData.get('name') as string) || undefined,
    member_ids: parsedMemberIds,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { type, name, member_ids } = parsed.data
  const supabase = createSupabaseServiceClient()

  // Deduplication for DIRECT conversations
  if (type === 'DIRECT') {
    const otherId = member_ids[0]

    // Find conversations where both the current user and the other user are members.
    // Query conversation_members for each user separately, then intersect.
    const { data: myMemberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', ctx.userId)

    const { data: theirMemberships } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', otherId)

    if (myMemberships && theirMemberships) {
      const myConvIds = new Set(myMemberships.map((m) => m.conversation_id))
      const sharedConvIds = theirMemberships
        .map((m) => m.conversation_id)
        .filter((id) => myConvIds.has(id))

      if (sharedConvIds.length > 0) {
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .in('id', sharedConvIds)
          .eq('type', 'DIRECT')
          .eq('hospital_id', hospitalId)
          .limit(1)
          .single()

        if (existing) {
          redirect(`/hospital/chat/${existing.id}`)
        }
      }
    }
  }

  // Insert the conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({
      hospital_id: hospitalId,
      type,
      name: name ?? null,
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (convErr || !conv) {
    return { error: 'Failed to create conversation. Please try again.' }
  }

  const conversationId = conv.id

  // Insert members: current user + supplied member_ids (deduplicated)
  const allMemberIds = Array.from(new Set([ctx.userId, ...member_ids]))
  const memberRows = allMemberIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
  }))

  const { error: membersError } = await supabase
    .from('conversation_members')
    .insert(memberRows)

  if (membersError) {
    return { error: 'Conversation created but failed to add members.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'CONVERSATION_CREATED',
    description: `${type} conversation created`,
    metadata: { conversationId, type, memberCount: allMemberIds.length },
  })

  redirect(`/hospital/chat/${conversationId}`)
}

// ---------------------------------------------------------------------------
// sendMessageAction
// ---------------------------------------------------------------------------

/**
 * Sends a message to a conversation.
 * Optionally inserts message_attachments when `attachment_paths` is provided
 * as a JSON string of AttachmentPayload[].
 *
 * Attachment payloads are re-validated server-side (MIME type and file size)
 * because client-side validation can be bypassed.
 */
export async function sendMessageAction(
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id
  if (!hospitalId) return { error: 'No hospital assigned to your account.' }

  const rawAttachments = (formData.get('attachment_paths') as string) || ''
  let attachments: AttachmentPayload[] = []

  if (rawAttachments) {
    try {
      const maybeArray: unknown = JSON.parse(rawAttachments)
      if (!Array.isArray(maybeArray)) {
        return { error: 'Invalid attachment data format.' }
      }
      attachments = maybeArray as AttachmentPayload[]
    } catch {
      return { error: 'Could not parse attachment data.' }
    }
  }

  // Server-side re-validation of attachment metadata using the canonical Zod
  // schema (mime type allowlist, fileSize bounds, path traversal prevention).
  // Client-side validation can be bypassed, so this is the authoritative gate.
  const attachmentParse = attachmentPayloadArraySchema.safeParse(attachments)
  if (!attachmentParse.success) {
    return { error: attachmentParse.error.issues[0]?.message ?? 'Invalid attachment data.' }
  }
  const validatedAttachments = attachmentParse.data

  // Additionally enforce hospital-scoped storage paths (context-dependent,
  // cannot be expressed in the shared schema).
  for (const att of validatedAttachments) {
    if (!att.storagePath.startsWith(`${hospitalId}/`)) {
      return { error: 'Invalid attachment path.' }
    }
  }

  const parsed = sendMessageSchema.safeParse({
    conversation_id: formData.get('conversation_id'),
    content: (formData.get('content') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid message data.' }
  }

  const { conversation_id, content } = parsed.data

  // Require content or at least one attachment
  if (!content?.trim() && attachments.length === 0) {
    return { error: 'A message must have content or at least one attachment.' }
  }

  // Verify the current user is a member of the conversation (RLS-scoped read)
  const supabaseServer = await createSupabaseServerClient()
  const { data: membership, error: membershipError } = await supabaseServer
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversation_id)
    .eq('user_id', ctx.userId)
    .single()

  if (membershipError || !membership) {
    return { error: 'You are not a member of this conversation.' }
  }

  const supabase = createSupabaseServiceClient()

  // Insert the message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id: ctx.userId,
      hospital_id: hospitalId,
      content: content ?? null,
    })
    .select('id')
    .single()

  if (msgError || !message) {
    return { error: 'Failed to send message. Please try again.' }
  }

  // Insert attachments if present (use validatedAttachments — Zod-parsed copy)
  if (validatedAttachments.length > 0) {
    const attachmentRows = validatedAttachments.map((a) => ({
      message_id: message.id,
      hospital_id: hospitalId,
      storage_path: a.storagePath,
      file_name: a.fileName,
      file_size: a.fileSize,
      mime_type: a.mimeType,
    }))

    const { error: attachError } = await supabase
      .from('message_attachments')
      .insert(attachmentRows)

    if (attachError) {
      console.error('[chat] Failed to persist attachments:', attachError.message)
    } else {
      await writeAuditLog({
        hospitalId,
        actorId: ctx.userId,
        actorRole: ctx.profile.role,
        eventType: 'ATTACHMENT_UPLOADED',
        description: `${validatedAttachments.length} attachment(s) uploaded to message`,
        metadata: {
          messageId: message.id,
          conversationId: conversation_id,
          count: validatedAttachments.length,
        },
      })
    }
  }

  // Update last_message_at on the conversation
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation_id)

  return { messageId: message.id }
}

// ---------------------------------------------------------------------------
// markReadAction
// ---------------------------------------------------------------------------

/**
 * Updates the current user's last_read_at timestamp in conversation_members.
 * No audit log — this is a high-frequency, low-significance operation.
 */
export async function markReadAction(conversationId: string): Promise<void> {
  const ctx = await requireAuth()
  const supabase = createSupabaseServiceClient()

  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', ctx.userId)
}

// ---------------------------------------------------------------------------
// deleteMessageAction
// ---------------------------------------------------------------------------

/**
 * Soft-deletes a message by setting deleted_at.
 * Only the original sender or a HOSPITAL_ADMIN / PLATFORM_ADMIN may delete.
 *
 * The hospital_id of the message is explicitly compared against the actor's
 * hospital_id.  This is mandatory because the service-role client bypasses
 * RLS — without this check a HOSPITAL_ADMIN from Hospital A could delete
 * messages belonging to Hospital B.
 */
export async function deleteMessageAction(messageId: string): Promise<void> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id
  // PLATFORM_ADMIN has no hospital_id — they may operate across tenants.
  if (!hospitalId && ctx.profile.role !== 'PLATFORM_ADMIN') {
    throw new Error('No hospital assigned to your account.')
  }

  const supabase = createSupabaseServiceClient()

  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('id, sender_id, conversation_id, hospital_id')
    .eq('id', messageId)
    .single()

  if (fetchError || !message) {
    throw new Error('Message not found.')
  }

  // [CRITICAL FIX] Enforce hospital isolation before any role check.
  // A HOSPITAL_ADMIN has elevated permissions within their own tenant only.
  const isPlatformAdmin = ctx.profile.role === 'PLATFORM_ADMIN'
  if (!isPlatformAdmin && message.hospital_id !== hospitalId) {
    throw new Error('You do not have permission to delete this message.')
  }

  const isAdmin =
    ctx.profile.role === 'HOSPITAL_ADMIN' || ctx.profile.role === 'PLATFORM_ADMIN'
  const isSender = message.sender_id === ctx.userId

  if (!isSender && !isAdmin) {
    throw new Error('You do not have permission to delete this message.')
  }

  const { error: deleteError } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)

  if (deleteError) {
    throw new Error('Failed to delete message.')
  }

  await writeAuditLog({
    hospitalId: message.hospital_id,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'MESSAGE_DELETED',
    description: 'Message soft-deleted',
    metadata: { messageId, conversationId: message.conversation_id },
  })
}

// ---------------------------------------------------------------------------
// addMemberAction
// ---------------------------------------------------------------------------

/**
 * Adds a user to an existing conversation.
 * Only HOSPITAL_ADMIN may add members.  The conversation must belong to the
 * actor's hospital (enforced via explicit hospital_id check — service-role
 * client bypasses RLS).
 */
export async function addMemberAction(
  _prev: MemberState,
  formData: FormData
): Promise<MemberState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id
  if (!hospitalId) return { error: 'No hospital assigned to your account.' }

  // Only admins may add members to conversations.
  const isAdmin =
    ctx.profile.role === 'HOSPITAL_ADMIN' || ctx.profile.role === 'PLATFORM_ADMIN'
  if (!isAdmin) {
    return { error: 'You do not have permission to add members to conversations.' }
  }

  const parsed = addMemberSchema.safeParse({
    conversation_id: formData.get('conversation_id'),
    user_id: formData.get('user_id'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const { conversation_id, user_id } = parsed.data
  const supabase = createSupabaseServiceClient()

  // [CRITICAL FIX] Verify the conversation belongs to the actor's hospital
  // before inserting a member.  Without this, any admin can add members to
  // conversations in other tenants.
  const { data: conv, error: convFetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversation_id)
    .eq('hospital_id', hospitalId)
    .maybeSingle()

  if (convFetchError || !conv) {
    return { error: 'Conversation not found.' }
  }

  const { error } = await supabase
    .from('conversation_members')
    .insert({ conversation_id, user_id })

  if (error) {
    // Unique constraint violation — user is already a member
    if (error.code === '23505') {
      return { error: 'User is already a member of this conversation.' }
    }
    return { error: 'Failed to add member. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'MEMBER_ADDED',
    description: 'User added to conversation',
    metadata: { conversationId: conversation_id, addedUserId: user_id },
  })

  return null
}

// ---------------------------------------------------------------------------
// removeMemberAction
// ---------------------------------------------------------------------------

/**
 * Removes a user from a conversation.
 * Only HOSPITAL_ADMIN may remove other members.  A user may remove themselves.
 * The conversation must belong to the actor's hospital.
 */
export async function removeMemberAction(
  conversationId: string,
  userId: string
): Promise<void> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id
  if (!hospitalId) throw new Error('No hospital assigned to your account.')

  // [CRITICAL FIX] Authorization: only an admin may remove someone else.
  const isAdmin =
    ctx.profile.role === 'HOSPITAL_ADMIN' || ctx.profile.role === 'PLATFORM_ADMIN'
  const isSelf = userId === ctx.userId

  if (!isAdmin && !isSelf) {
    throw new Error('You do not have permission to remove this member.')
  }

  const supabase = createSupabaseServiceClient()

  // [CRITICAL FIX] Verify the conversation belongs to this hospital before
  // deleting any membership row.
  const { data: conv, error: convFetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('hospital_id', hospitalId)
    .maybeSingle()

  if (convFetchError || !conv) {
    throw new Error('Conversation not found.')
  }

  const { error } = await supabase
    .from('conversation_members')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Failed to remove member.')
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'MEMBER_REMOVED',
    description: 'User removed from conversation',
    metadata: { conversationId, removedUserId: userId },
  })
}

// ---------------------------------------------------------------------------
// getAttachmentUrlAction
// ---------------------------------------------------------------------------

/**
 * Generates a signed URL for a chat attachment (1-hour expiry).
 *
 * The caller must be authenticated.  The storage path is verified to start
 * with the actor's hospital_id prefix, preventing cross-tenant file access
 * via the service-role storage client.
 */
export async function getAttachmentUrlAction(storagePath: string): Promise<string | null> {
  // [CRITICAL FIX] Require authentication — previously anyone who obtained a
  // storage path string could call this action without being logged in.
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id

  // PLATFORM_ADMIN may access any attachment; regular staff are restricted to
  // their own hospital's storage prefix.
  const isPlatformAdmin = ctx.profile.role === 'PLATFORM_ADMIN'
  if (!isPlatformAdmin) {
    if (!hospitalId) return null

    // [CRITICAL FIX] Enforce that the requested path belongs to the caller's
    // hospital.  Storage paths are structured as `{hospitalId}/{...rest}`.
    if (!storagePath.startsWith(`${hospitalId}/`)) {
      return null
    }
  }

  const supabase = createSupabaseServiceClient()
  const { data } = await supabase.storage
    .from(CHAT_BUCKET)
    .createSignedUrl(storagePath, 3600)

  return data?.signedUrl ?? null
}
