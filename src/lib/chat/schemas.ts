/**
 * Zod validation schemas for the Internal Communication (chat) feature.
 * Shared between server actions and any client-side pre-validation.
 */
import { z } from 'zod'

/**
 * Schema for creating a new conversation.
 * - DIRECT conversations: exactly one member_id (the other participant).
 * - GROUP / BROADCAST conversations: name is required.
 */
export const createConversationSchema = z
  .object({
    type: z.enum(['DIRECT', 'GROUP', 'BROADCAST']),
    name: z.string().max(120).optional(),
    member_ids: z
      .array(z.string().uuid('Each member ID must be a valid UUID'))
      .min(1, 'At least one member is required'),
  })
  .superRefine((data, ctx) => {
    if ((data.type === 'GROUP' || data.type === 'BROADCAST') && !data.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name is required for GROUP and BROADCAST conversations',
        path: ['name'],
      })
    }
    if (data.type === 'DIRECT' && data.member_ids.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DIRECT conversations require exactly one member',
        path: ['member_ids'],
      })
    }
  })

/**
 * Schema for sending a message.
 * Content is optional only when attachments are present (validated in the action).
 */
export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid('conversation_id must be a valid UUID'),
  content: z
    .string()
    .max(4000, 'Message content must be 4000 characters or fewer')
    .optional(),
})

/**
 * Schema for adding a member to a conversation.
 */
export const addMemberSchema = z.object({
  conversation_id: z.string().uuid('conversation_id must be a valid UUID'),
  user_id: z.string().uuid('user_id must be a valid UUID'),
})

/**
 * Schema for a single file attachment payload sent from the client.
 * Re-validated server-side in sendMessageAction to prevent client bypass.
 */
export const attachmentPayloadSchema = z.object({
  storagePath: z
    .string()
    .min(1, 'storagePath must not be empty')
    .max(512, 'storagePath must be 512 characters or fewer')
    .refine((p) => !p.startsWith('/'), 'storagePath must be relative (no leading slash)')
    .refine((p) => !p.includes('..'), 'Invalid storage path (path traversal not allowed)'),
  fileName: z
    .string()
    .min(1, 'fileName must not be empty')
    .max(255, 'fileName must be 255 characters or fewer'),
  fileSize: z
    .number()
    .int('fileSize must be an integer')
    .min(1, 'fileSize must be at least 1 byte')
    .max(10 * 1024 * 1024, 'fileSize must not exceed 10 MB'),
  mimeType: z.enum(
    ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'],
    { error: 'Unsupported file type' }
  ),
})

export type AttachmentPayload = z.infer<typeof attachmentPayloadSchema>

/**
 * Schema for the array of attachments on a single message (max 5).
 */
export const attachmentPayloadArraySchema = z
  .array(attachmentPayloadSchema)
  .max(5, 'A message may have at most 5 attachments')
