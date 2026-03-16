/**
 * Unit tests for chat Zod schemas (src/lib/chat/schemas.ts).
 *
 * TDD workflow: tests describe the expected validation contract.
 * The schemas already exist — this is the GREEN verification phase.
 *
 * Note: Zod v4 enforces RFC 4122 UUID variants. The version nibble in a UUID
 * must be 1–8, and the variant nibble must be 8–b.  Plain sequential IDs like
 * 00000000-0000-0000-0000-000000000001 are rejected.  Use real v4 UUIDs below.
 */

import {
  createConversationSchema,
  sendMessageSchema,
  addMemberSchema,
  attachmentPayloadSchema,
  attachmentPayloadArraySchema,
} from '../schemas'

// ---------------------------------------------------------------------------
// RFC 4122 v4 UUIDs safe for use with Zod v4 .uuid() validation
// ---------------------------------------------------------------------------

const UUID_A = '550e8400-e29b-41d4-a716-446655440000'
const UUID_B = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
const UUID_C = '6ba7b811-9dad-41d1-80b4-00c04fd430c8'

// ---------------------------------------------------------------------------
// Helper: extract issue messages from a failed Zod parse result
// ---------------------------------------------------------------------------

function issueMessages(result: { success: false; error: { issues: { message: string }[] } }): string[] {
  return result.error.issues.map((i) => i.message)
}

// ---------------------------------------------------------------------------
// createConversationSchema
// ---------------------------------------------------------------------------

describe('createConversationSchema', () => {
  describe('DIRECT conversations', () => {
    it('accepts a valid DIRECT payload with exactly one member', () => {
      const result = createConversationSchema.safeParse({
        type: 'DIRECT',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(true)
    })

    it('rejects DIRECT with zero members — violates min(1) constraint', () => {
      const result = createConversationSchema.safeParse({
        type: 'DIRECT',
        member_ids: [],
      })
      expect(result.success).toBe(false)
      if (result.success) return
      // Either the min(1) array issue or the superRefine "exactly one member" issue
      expect(result.error.issues.length).toBeGreaterThan(0)
    })

    it('rejects DIRECT with two members — must be exactly one', () => {
      const result = createConversationSchema.safeParse({
        type: 'DIRECT',
        member_ids: [UUID_A, UUID_B],
      })
      expect(result.success).toBe(false)
      if (result.success) return
      const messages = issueMessages(result)
      expect(messages.some((m) => m.includes('exactly one member'))).toBe(true)
    })

    it('rejects DIRECT when member_id is not a valid UUID', () => {
      const result = createConversationSchema.safeParse({
        type: 'DIRECT',
        member_ids: ['not-a-uuid'],
      })
      expect(result.success).toBe(false)
      if (result.success) return
      const messages = issueMessages(result)
      expect(messages.some((m) => m.toLowerCase().includes('uuid'))).toBe(true)
    })

    it('accepts an optional name field for DIRECT conversations', () => {
      const result = createConversationSchema.safeParse({
        type: 'DIRECT',
        name: 'optional name',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GROUP conversations', () => {
    it('accepts a valid GROUP payload with name and multiple members', () => {
      const result = createConversationSchema.safeParse({
        type: 'GROUP',
        name: 'ICU Team',
        member_ids: [UUID_A, UUID_B],
      })
      expect(result.success).toBe(true)
    })

    it('accepts a GROUP with exactly one member (minimum is one)', () => {
      const result = createConversationSchema.safeParse({
        type: 'GROUP',
        name: 'Solo Group',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(true)
    })

    it('rejects GROUP without a name', () => {
      const result = createConversationSchema.safeParse({
        type: 'GROUP',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
      if (result.success) return
      const messages = issueMessages(result)
      expect(
        messages.some((m) => m.includes('Name is required for GROUP and BROADCAST'))
      ).toBe(true)
    })

    it('rejects GROUP with a whitespace-only name', () => {
      const result = createConversationSchema.safeParse({
        type: 'GROUP',
        name: '   ',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
      if (result.success) return
      const messages = issueMessages(result)
      expect(
        messages.some((m) => m.includes('Name is required for GROUP and BROADCAST'))
      ).toBe(true)
    })

    it('rejects GROUP with a name longer than 120 characters', () => {
      const result = createConversationSchema.safeParse({
        type: 'GROUP',
        name: 'A'.repeat(121),
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
    })

    it('rejects GROUP with zero members', () => {
      const result = createConversationSchema.safeParse({
        type: 'GROUP',
        name: 'Empty Group',
        member_ids: [],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('BROADCAST conversations', () => {
    it('accepts a valid BROADCAST payload with name and members', () => {
      const result = createConversationSchema.safeParse({
        type: 'BROADCAST',
        name: 'All Staff Announcement',
        member_ids: [UUID_A, UUID_B, UUID_C],
      })
      expect(result.success).toBe(true)
    })

    it('rejects BROADCAST without a name', () => {
      const result = createConversationSchema.safeParse({
        type: 'BROADCAST',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
      if (result.success) return
      const messages = issueMessages(result)
      expect(
        messages.some((m) => m.includes('Name is required for GROUP and BROADCAST'))
      ).toBe(true)
    })

    it('rejects BROADCAST with a whitespace-only name', () => {
      const result = createConversationSchema.safeParse({
        type: 'BROADCAST',
        name: '\t\n ',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('type field validation', () => {
    it('rejects an unknown conversation type', () => {
      const result = createConversationSchema.safeParse({
        type: 'PRIVATE',
        name: 'Private Room',
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
    })

    it('rejects a missing type field', () => {
      const result = createConversationSchema.safeParse({
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
    })

    it('rejects a null type field', () => {
      const result = createConversationSchema.safeParse({
        type: null,
        member_ids: [UUID_A],
      })
      expect(result.success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// sendMessageSchema
// ---------------------------------------------------------------------------

describe('sendMessageSchema', () => {
  it('accepts a valid payload with conversation_id and content', () => {
    const result = sendMessageSchema.safeParse({
      conversation_id: UUID_A,
      content: 'Hello, team!',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.content).toBe('Hello, team!')
    expect(result.data.conversation_id).toBe(UUID_A)
  })

  it('accepts a payload without content (content is optional)', () => {
    const result = sendMessageSchema.safeParse({
      conversation_id: UUID_A,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.content).toBeUndefined()
  })

  it('rejects a non-UUID conversation_id', () => {
    const result = sendMessageSchema.safeParse({
      conversation_id: 'not-a-uuid',
      content: 'Hello',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const messages = issueMessages(result)
    expect(messages.some((m) => m.includes('UUID'))).toBe(true)
  })

  it('rejects content longer than 4000 characters', () => {
    const result = sendMessageSchema.safeParse({
      conversation_id: UUID_A,
      content: 'X'.repeat(4001),
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const messages = issueMessages(result)
    expect(messages.some((m) => m.includes('4000'))).toBe(true)
  })

  it('accepts content of exactly 4000 characters (boundary)', () => {
    const result = sendMessageSchema.safeParse({
      conversation_id: UUID_A,
      content: 'X'.repeat(4000),
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing conversation_id', () => {
    const result = sendMessageSchema.safeParse({ content: 'Hello' })
    expect(result.success).toBe(false)
  })

  it('rejects a null conversation_id', () => {
    const result = sendMessageSchema.safeParse({
      conversation_id: null,
      content: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('accepts an empty string content (schema allows it; action enforces non-empty)', () => {
    // The schema itself does not enforce non-empty — the action does.
    const result = sendMessageSchema.safeParse({
      conversation_id: UUID_A,
      content: '',
    })
    // Empty string is valid at schema level (no .min() on content)
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// addMemberSchema
// ---------------------------------------------------------------------------

describe('addMemberSchema', () => {
  it('accepts valid UUIDs for both fields', () => {
    const result = addMemberSchema.safeParse({
      conversation_id: UUID_A,
      user_id: UUID_B,
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.conversation_id).toBe(UUID_A)
    expect(result.data.user_id).toBe(UUID_B)
  })

  it('rejects a non-UUID conversation_id', () => {
    const result = addMemberSchema.safeParse({
      conversation_id: 'bad-id',
      user_id: UUID_B,
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const messages = issueMessages(result)
    expect(messages.some((m) => m.includes('UUID'))).toBe(true)
  })

  it('rejects a non-UUID user_id', () => {
    const result = addMemberSchema.safeParse({
      conversation_id: UUID_A,
      user_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const messages = issueMessages(result)
    expect(messages.some((m) => m.includes('UUID'))).toBe(true)
  })

  it('rejects completely missing fields', () => {
    const result = addMemberSchema.safeParse({})
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
  })

  it('rejects when only conversation_id is provided', () => {
    const result = addMemberSchema.safeParse({ conversation_id: UUID_A })
    expect(result.success).toBe(false)
  })

  it('rejects when only user_id is provided', () => {
    const result = addMemberSchema.safeParse({ user_id: UUID_B })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// attachmentPayloadSchema
// ---------------------------------------------------------------------------

describe('attachmentPayloadSchema', () => {
  const valid = {
    storagePath: 'hosp-uuid/conv-uuid/photo.png',
    fileName: 'photo.png',
    fileSize: 1024,
    mimeType: 'image/png',
  }

  it('accepts a valid attachment payload', () => {
    expect(attachmentPayloadSchema.safeParse(valid).success).toBe(true)
  })

  it.each(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'])(
    'accepts mime type "%s"',
    (mimeType) => expect(attachmentPayloadSchema.safeParse({ ...valid, mimeType }).success).toBe(true)
  )

  it('rejects disallowed mime type', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, mimeType: 'application/javascript' }).success).toBe(false)
  })

  it('rejects path traversal with ".."', () => {
    const r = attachmentPayloadSchema.safeParse({ ...valid, storagePath: 'a/../b/photo.png' })
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.issues.some((i) => i.message.includes('Invalid storage path'))).toBe(true)
  })

  it('rejects absolute storagePath starting with "/"', () => {
    const r = attachmentPayloadSchema.safeParse({ ...valid, storagePath: '/etc/passwd' })
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.issues.some((i) => i.message.includes('relative'))).toBe(true)
  })

  it('rejects empty storagePath', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, storagePath: '' }).success).toBe(false)
  })

  it('rejects storagePath over 512 chars', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, storagePath: 'a'.repeat(513) }).success).toBe(false)
  })

  it('rejects fileSize of 0', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileSize: 0 }).success).toBe(false)
  })

  it('rejects negative fileSize', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileSize: -1 }).success).toBe(false)
  })

  it('accepts fileSize at the 10 MB boundary', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileSize: 10 * 1024 * 1024 }).success).toBe(true)
  })

  it('rejects fileSize over 10 MB', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileSize: 10 * 1024 * 1024 + 1 }).success).toBe(false)
  })

  it('rejects non-integer fileSize', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileSize: 1024.5 }).success).toBe(false)
  })

  it('rejects empty fileName', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileName: '' }).success).toBe(false)
  })

  it('rejects fileName over 255 chars', () => {
    expect(attachmentPayloadSchema.safeParse({ ...valid, fileName: 'a'.repeat(256) }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// attachmentPayloadArraySchema
// ---------------------------------------------------------------------------

describe('attachmentPayloadArraySchema', () => {
  const att = { storagePath: 'h/c/photo.png', fileName: 'photo.png', fileSize: 1024, mimeType: 'image/png' }

  it('accepts empty array', () => {
    expect(attachmentPayloadArraySchema.safeParse([]).success).toBe(true)
  })

  it('accepts array of up to 5 items', () => {
    expect(attachmentPayloadArraySchema.safeParse(Array(5).fill(att)).success).toBe(true)
  })

  it('rejects array of 6 items', () => {
    const r = attachmentPayloadArraySchema.safeParse(Array(6).fill(att))
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.issues.some((i) => i.message.includes('5'))).toBe(true)
  })

  it('rejects if any element has an invalid mime type', () => {
    expect(
      attachmentPayloadArraySchema.safeParse([att, { ...att, mimeType: 'application/exe' }]).success
    ).toBe(false)
  })
})
