/**
 * Unit tests for Phase 4 Internal Chat server actions.
 * File: src/app/hospital/chat/actions.ts
 *
 * Strategy:
 *   - Mock `requireAuth` (guards.ts) to inject controlled auth context.
 *   - Mock `createSupabaseServiceClient` and `createSupabaseServerClient`
 *     (supabase/server.ts) to return chainable query builders.
 *   - Mock `writeAuditLog` (audit/log.ts) to avoid real DB calls.
 *   - Mock `next/navigation` redirect to capture redirect targets.
 *
 * The 'use server' directive is stripped by ts-jest (it's just a string literal);
 * the module still exports its functions normally in a Node test environment.
 */

import { jest } from '@jest/globals'

// ---------------------------------------------------------------------------
// Mock next/navigation before any import that touches it
// ---------------------------------------------------------------------------

const mockRedirect = jest.fn((url: string): never => {
  // Simulate the redirect throwing a special error (as Next.js does at runtime)
  // so code after redirect() is not executed in tests.
  throw Object.assign(new Error(`NEXT_REDIRECT:${url}`), { digest: `NEXT_REDIRECT:${url}` })
})

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

// ---------------------------------------------------------------------------
// Mock next/headers (required by createSupabaseServerClient)
// ---------------------------------------------------------------------------

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}))

// ---------------------------------------------------------------------------
// Shared mock state for supabase query builder
// ---------------------------------------------------------------------------

/**
 * A flexible chainable mock that stores the last configured return values.
 * Each test resets these via `setNextQueryResult`.
 */

interface QueryResult {
  data: unknown
  error: { message: string; code?: string } | null
}

// Results for service client (used by most DB operations)
let serviceQueryResults: QueryResult[] = []
let serviceQueryIndex = 0

// Results for server client (used only in sendMessageAction membership check)
let serverQueryResult: QueryResult = { data: null, error: null }

function setNextServiceResults(...results: QueryResult[]) {
  serviceQueryResults = results
  serviceQueryIndex = 0
}

function setNextServerResult(result: QueryResult) {
  serverQueryResult = result
}

function makeChainableQuery(getResult: () => QueryResult) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'limit', 'maybeSingle', 'single', 'from']

  // Each method returns the same chain object (fluent builder pattern)
  for (const m of methods) {
    chain[m] = jest.fn((..._args: unknown[]) => chain)
  }

  // Awaiting the chain resolves to the configured result
  const thenable = {
    then(resolve: (v: QueryResult) => unknown, reject: (e: unknown) => unknown) {
      try {
        resolve(getResult())
      } catch (e) {
        reject(e)
      }
      return Promise.resolve()
    },
  }

  // Attach thenable to every terminal and non-terminal method
  for (const m of methods) {
    const original = chain[m] as jest.Mock
    ;(chain[m] as jest.Mock) = jest.fn((...args: unknown[]) => {
      original(...args)
      return Object.assign(chain, thenable)
    })
  }

  return Object.assign(chain, thenable)
}

// ---------------------------------------------------------------------------
// Storage mock (used by getAttachmentUrlAction)
// ---------------------------------------------------------------------------

let storageMockResult: { data: { signedUrl: string } | null } = { data: null }

const mockStorageFrom = jest.fn(() => ({
  createSignedUrl: jest.fn(async (_path: string, _ttl: number) => storageMockResult),
}))

// ---------------------------------------------------------------------------
// Build supabase client mocks
// ---------------------------------------------------------------------------

/**
 * Service client: each call to .from() returns a fresh chainable builder
 * that resolves to the next item in `serviceQueryResults`.
 */
const mockServiceClient = {
  from: jest.fn((_table: string) =>
    makeChainableQuery(() => {
      const result = serviceQueryResults[serviceQueryIndex] ?? { data: null, error: null }
      serviceQueryIndex++
      return result
    })
  ),
  storage: {
    from: mockStorageFrom,
  },
}

/**
 * Server client: single chainable builder that resolves to `serverQueryResult`.
 */
const mockServerClient = {
  from: jest.fn((_table: string) =>
    makeChainableQuery(() => serverQueryResult)
  ),
}

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServiceClient: jest.fn(() => mockServiceClient),
  createSupabaseServerClient: jest.fn(async () => mockServerClient),
}))

// ---------------------------------------------------------------------------
// Mock audit log (fire-and-forget; we do not test it here)
// ---------------------------------------------------------------------------

const mockWriteAuditLog = jest.fn(async () => undefined)

jest.mock('@/lib/audit/log', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

// ---------------------------------------------------------------------------
// Mock requireAuth
// ---------------------------------------------------------------------------

import type { AuthContext } from '@/lib/rbac/guards'

const mockRequireAuth = jest.fn<() => Promise<AuthContext>>()

jest.mock('@/lib/rbac/guards', () => ({
  requireAuth: mockRequireAuth,
}))

// ---------------------------------------------------------------------------
// Import the actions under test AFTER mocks are set up
// ---------------------------------------------------------------------------

import {
  createConversationAction,
  sendMessageAction,
  deleteMessageAction,
  addMemberAction,
  removeMemberAction,
  getAttachmentUrlAction,
} from '../actions'

// ---------------------------------------------------------------------------
// RFC 4122-valid UUIDs
// ---------------------------------------------------------------------------

const HOSP_ID   = '550e8400-e29b-41d4-a716-446655440001'
const HOSP_ID_B = '550e8400-e29b-41d4-a716-446655440002'
const USER_ID   = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
const OTHER_ID  = '6ba7b811-9dad-41d1-80b4-00c04fd430c8'
const CONV_ID   = '6ba7b812-9dad-41d1-80b4-00c04fd430c8'
const MSG_ID    = '6ba7b813-9dad-41d1-80b4-00c04fd430c8'

// ---------------------------------------------------------------------------
// Auth context factories
// ---------------------------------------------------------------------------

function doctorContext(): AuthContext {
  return {
    userId: USER_ID,
    email: 'doctor@hospital.test',
    profile: {
      id: USER_ID,
      hospital_id: HOSP_ID,
      role: 'DOCTOR',
      full_name: 'Dr. Test',
      display_name: null,
      phone: null,
      is_active: true,
      specialty: null,
      qualifications: null,
      license_number: null,
      license_expiry: null,
      registration_number: null,
      years_of_experience: null,
      department_id: null,
      employment_type: null,
      hire_date: null,
      address: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  }
}

function hospitalAdminContext(): AuthContext {
  return {
    ...doctorContext(),
    profile: { ...doctorContext().profile, role: 'HOSPITAL_ADMIN' },
  }
}

function platformAdminContext(): AuthContext {
  return {
    userId: USER_ID,
    email: 'platform@system.test',
    profile: {
      id: USER_ID,
      hospital_id: null,
      role: 'PLATFORM_ADMIN',
      full_name: 'Platform Admin',
      display_name: null,
      phone: null,
      is_active: true,
      specialty: null,
      qualifications: null,
      license_number: null,
      license_expiry: null,
      registration_number: null,
      years_of_experience: null,
      department_id: null,
      employment_type: null,
      hire_date: null,
      address: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  }
}

// ---------------------------------------------------------------------------
// Helper: build FormData
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v)
  }
  return fd
}

// ---------------------------------------------------------------------------
// Helper: assert redirect was called (redirect throws in the mock)
// ---------------------------------------------------------------------------

async function expectRedirectTo(
  fn: () => Promise<unknown>,
  urlFragment: string
): Promise<void> {
  try {
    await fn()
    throw new Error('Expected redirect to be called, but function returned normally.')
  } catch (err: unknown) {
    const e = err as Error
    if (!e.message.includes('NEXT_REDIRECT')) {
      throw new Error(`Expected NEXT_REDIRECT error but got: ${e.message}`)
    }
    expect(e.message).toContain(urlFragment)
  }
}

// ---------------------------------------------------------------------------
// beforeEach: reset all mocks and set sane defaults
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()

  mockRequireAuth.mockResolvedValue(doctorContext())
  setNextServiceResults()
  setNextServerResult({ data: null, error: null })
  storageMockResult = { data: null }
})

// ===========================================================================
// createConversationAction
// ===========================================================================

describe('createConversationAction', () => {
  describe('when user has no hospital_id', () => {
    it('returns an error', async () => {
      mockRequireAuth.mockResolvedValue({
        ...doctorContext(),
        profile: { ...doctorContext().profile, hospital_id: null },
      })

      const fd = makeFormData({ type: 'DIRECT', member_ids: OTHER_ID })
      const result = await createConversationAction(null, fd)
      expect(result).toEqual({ error: 'No hospital assigned to your account.' })
    })
  })

  describe('schema validation', () => {
    it('returns fieldErrors for an invalid type', async () => {
      const fd = makeFormData({ type: 'INVALID', member_ids: OTHER_ID })
      const result = await createConversationAction(null, fd)
      expect(result).toHaveProperty('fieldErrors')
    })

    it('returns fieldErrors when GROUP conversation has no name', async () => {
      const fd = makeFormData({ type: 'GROUP', member_ids: OTHER_ID })
      const result = await createConversationAction(null, fd)
      expect(result).toHaveProperty('fieldErrors')
    })

    it('returns fieldErrors when member_ids is empty', async () => {
      const fd = makeFormData({ type: 'DIRECT', member_ids: '' })
      const result = await createConversationAction(null, fd)
      expect(result).toHaveProperty('fieldErrors')
    })

    it('returns fieldErrors when member_id is not a valid UUID', async () => {
      const fd = makeFormData({ type: 'DIRECT', member_ids: 'not-a-uuid' })
      const result = await createConversationAction(null, fd)
      expect(result).toHaveProperty('fieldErrors')
    })
  })

  describe('DIRECT conversation deduplication', () => {
    it('redirects to the existing conversation when a DIRECT conv already exists', async () => {
      // Both users share CONV_ID as an existing DIRECT conversation
      setNextServiceResults(
        // myMemberships
        { data: [{ conversation_id: CONV_ID }], error: null },
        // theirMemberships
        { data: [{ conversation_id: CONV_ID }], error: null },
        // existing conversation lookup (shared conv is DIRECT in same hospital)
        { data: { id: CONV_ID }, error: null },
      )

      const fd = makeFormData({ type: 'DIRECT', member_ids: OTHER_ID })

      await expectRedirectTo(
        () => createConversationAction(null, fd),
        `/hospital/chat/${CONV_ID}`
      )
    })

    it('creates a new conversation when no shared DIRECT conversation exists', async () => {
      setNextServiceResults(
        // myMemberships — no shared convs
        { data: [], error: null },
        // theirMemberships — no shared convs
        { data: [], error: null },
        // insert conversation
        { data: { id: CONV_ID }, error: null },
        // insert members
        { data: null, error: null },
        // audit log (via writeAuditLog's own service client call — mocked separately)
        { data: null, error: null },
        // last_message_at update is not called on create — skip
      )

      const fd = makeFormData({ type: 'DIRECT', member_ids: OTHER_ID })

      await expectRedirectTo(
        () => createConversationAction(null, fd),
        `/hospital/chat/${CONV_ID}`
      )
    })

    it('creates a new conversation when users share a GROUP but no DIRECT conversation', async () => {
      const GROUP_CONV_ID = '6ba7b814-9dad-41d1-80b4-00c04fd430c8'
      setNextServiceResults(
        // myMemberships — shared with other user in a GROUP conv
        { data: [{ conversation_id: GROUP_CONV_ID }], error: null },
        // theirMemberships — same GROUP conv
        { data: [{ conversation_id: GROUP_CONV_ID }], error: null },
        // lookup for DIRECT type in shared convs — returns null (it's a GROUP)
        { data: null, error: { message: 'Row not found', code: 'PGRST116' } },
        // insert new DIRECT conversation
        { data: { id: CONV_ID }, error: null },
        // insert members
        { data: null, error: null },
      )

      const fd = makeFormData({ type: 'DIRECT', member_ids: OTHER_ID })

      await expectRedirectTo(
        () => createConversationAction(null, fd),
        `/hospital/chat/${CONV_ID}`
      )
    })
  })

  describe('GROUP / BROADCAST creation', () => {
    it('creates a GROUP conversation and redirects', async () => {
      setNextServiceResults(
        // insert conversation
        { data: { id: CONV_ID }, error: null },
        // insert members
        { data: null, error: null },
      )

      const fd = makeFormData({
        type: 'GROUP',
        name: 'ICU Team',
        member_ids: OTHER_ID,
      })

      await expectRedirectTo(
        () => createConversationAction(null, fd),
        `/hospital/chat/${CONV_ID}`
      )
    })

    it('returns an error when conversation DB insert fails', async () => {
      setNextServiceResults(
        // insert conversation fails
        { data: null, error: { message: 'DB error' } },
      )

      const fd = makeFormData({
        type: 'GROUP',
        name: 'Broken Group',
        member_ids: OTHER_ID,
      })

      const result = await createConversationAction(null, fd)
      expect(result).toEqual({ error: 'Failed to create conversation. Please try again.' })
    })

    it('returns an error when member insert fails', async () => {
      setNextServiceResults(
        // insert conversation succeeds
        { data: { id: CONV_ID }, error: null },
        // insert members fails
        { data: null, error: { message: 'members insert failed' } },
      )

      const fd = makeFormData({
        type: 'GROUP',
        name: 'Partial Group',
        member_ids: OTHER_ID,
      })

      const result = await createConversationAction(null, fd)
      expect(result).toEqual({ error: 'Conversation created but failed to add members.' })
    })
  })
})

// ===========================================================================
// sendMessageAction
// ===========================================================================

describe('sendMessageAction', () => {
  describe('when user has no hospital_id', () => {
    it('returns an error', async () => {
      mockRequireAuth.mockResolvedValue({
        ...doctorContext(),
        profile: { ...doctorContext().profile, hospital_id: null },
      })

      const fd = makeFormData({ conversation_id: CONV_ID, content: 'Hello' })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ error: 'No hospital assigned to your account.' })
    })
  })

  describe('schema validation', () => {
    it('returns an error for an invalid conversation_id', async () => {
      const fd = makeFormData({ conversation_id: 'bad-uuid', content: 'Hello' })
      const result = await sendMessageAction(null, fd)
      expect(result).toHaveProperty('error')
    })
  })

  describe('attachment validation', () => {
    const validAttachment = JSON.stringify([
      {
        storagePath: `${HOSP_ID}/conv/file.png`,
        fileName: 'file.png',
        fileSize: 1024,
        mimeType: 'image/png',
      },
    ])

    it('returns an error for malformed JSON in attachment_paths', async () => {
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: '{not valid json',
      })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ error: 'Could not parse attachment data.' })
    })

    it('returns an error when attachment_paths is not an array', async () => {
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify({ storagePath: 'x' }),
      })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ error: 'Invalid attachment data format.' })
    })

    it('returns an error when more than MAX_ATTACHMENTS (5) are provided', async () => {
      const att = {
        storagePath: `${HOSP_ID}/f.png`,
        fileName: 'f.png',
        fileSize: 100,
        mimeType: 'image/png',
      }
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify(Array(6).fill(att)),
      })
      const result = await sendMessageAction(null, fd)
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toContain('5')
    })

    it('returns an error for a disallowed MIME type', async () => {
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify([
          {
            storagePath: `${HOSP_ID}/f.exe`,
            fileName: 'f.exe',
            fileSize: 100,
            mimeType: 'application/exe',
          },
        ]),
      })
      const result = await sendMessageAction(null, fd)
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toMatch(/not allowed|Unsupported file type/i)
    })

    it('returns an error when file size exceeds 10 MB', async () => {
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify([
          {
            storagePath: `${HOSP_ID}/big.png`,
            fileName: 'big.png',
            fileSize: 10 * 1024 * 1024 + 1,
            mimeType: 'image/png',
          },
        ]),
      })
      const result = await sendMessageAction(null, fd)
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toContain('10 MB')
    })

    it('returns an error when storagePath does not start with hospitalId/', async () => {
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify([
          {
            // Path belongs to a different hospital — IDOR prevention
            storagePath: `${HOSP_ID_B}/evil.png`,
            fileName: 'evil.png',
            fileSize: 100,
            mimeType: 'image/png',
          },
        ]),
      })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ error: 'Invalid attachment path.' })
    })

    it('accepts a valid attachment from the correct hospital', async () => {
      // membership check passes
      setNextServerResult({ data: { id: 'member-row-id' }, error: null })
      // message insert
      setNextServiceResults(
        { data: { id: MSG_ID }, error: null },
        // attachment insert
        { data: null, error: null },
        // last_message_at update
        { data: null, error: null },
      )

      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Here is the file',
        attachment_paths: validAttachment,
      })

      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ messageId: MSG_ID })
    })
  })

  describe('membership check', () => {
    it('returns an error when the user is not a member of the conversation', async () => {
      // membership check fails — no row
      setNextServerResult({ data: null, error: { message: 'No rows' } })

      const fd = makeFormData({ conversation_id: CONV_ID, content: 'Hello' })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ error: 'You are not a member of this conversation.' })
    })
  })

  describe('content / attachment requirement', () => {
    it('returns an error when content is empty and no attachments are provided', async () => {
      // membership check passes
      setNextServerResult({ data: { id: 'member-row-id' }, error: null })

      const fd = makeFormData({ conversation_id: CONV_ID, content: '   ' })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({
        error: 'A message must have content or at least one attachment.',
      })
    })

    it('returns an error when content is missing and no attachments are provided', async () => {
      setNextServerResult({ data: { id: 'member-row-id' }, error: null })

      // No content field at all
      const fd = makeFormData({ conversation_id: CONV_ID })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({
        error: 'A message must have content or at least one attachment.',
      })
    })
  })

  describe('happy path', () => {
    it('returns messageId on successful send', async () => {
      setNextServerResult({ data: { id: 'member-row-id' }, error: null })
      setNextServiceResults(
        // message insert
        { data: { id: MSG_ID }, error: null },
        // last_message_at update
        { data: null, error: null },
      )

      const fd = makeFormData({ conversation_id: CONV_ID, content: 'Hello team' })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ messageId: MSG_ID })
    })

    it('returns an error when message DB insert fails', async () => {
      setNextServerResult({ data: { id: 'member-row-id' }, error: null })
      setNextServiceResults(
        { data: null, error: { message: 'Insert failed' } },
      )

      const fd = makeFormData({ conversation_id: CONV_ID, content: 'Hello' })
      const result = await sendMessageAction(null, fd)
      expect(result).toEqual({ error: 'Failed to send message. Please try again.' })
    })
  })
})

// ===========================================================================
// deleteMessageAction
// ===========================================================================

describe('deleteMessageAction', () => {
  describe('when user has no hospital_id and is not PLATFORM_ADMIN', () => {
    it('throws an error', async () => {
      mockRequireAuth.mockResolvedValue({
        ...doctorContext(),
        profile: { ...doctorContext().profile, hospital_id: null },
      })

      await expect(deleteMessageAction(MSG_ID)).rejects.toThrow(
        'No hospital assigned to your account.'
      )
    })
  })

  describe('hospital isolation (IDOR prevention)', () => {
    it('throws when the message belongs to a different hospital', async () => {
      // Message belongs to HOSP_ID_B, but actor is in HOSP_ID
      setNextServiceResults({
        data: {
          id: MSG_ID,
          sender_id: OTHER_ID,
          conversation_id: CONV_ID,
          hospital_id: HOSP_ID_B, // different hospital!
        },
        error: null,
      })

      await expect(deleteMessageAction(MSG_ID)).rejects.toThrow(
        'You do not have permission to delete this message.'
      )
    })

    it('throws when the message is not found', async () => {
      setNextServiceResults({ data: null, error: { message: 'Not found' } })

      await expect(deleteMessageAction(MSG_ID)).rejects.toThrow('Message not found.')
    })
  })

  describe('sender check', () => {
    it('allows the sender to delete their own message', async () => {
      setNextServiceResults(
        // fetch message — sender is the current user
        {
          data: {
            id: MSG_ID,
            sender_id: USER_ID,
            conversation_id: CONV_ID,
            hospital_id: HOSP_ID,
          },
          error: null,
        },
        // update deleted_at
        { data: null, error: null },
      )

      await expect(deleteMessageAction(MSG_ID)).resolves.toBeUndefined()
    })

    it('prevents a non-sender non-admin from deleting another user\'s message', async () => {
      setNextServiceResults({
        data: {
          id: MSG_ID,
          sender_id: OTHER_ID, // different sender
          conversation_id: CONV_ID,
          hospital_id: HOSP_ID,
        },
        error: null,
      })

      // Actor is DOCTOR, not sender, not admin
      await expect(deleteMessageAction(MSG_ID)).rejects.toThrow(
        'You do not have permission to delete this message.'
      )
    })
  })

  describe('admin check', () => {
    it('allows HOSPITAL_ADMIN to delete any message in their hospital', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        {
          data: {
            id: MSG_ID,
            sender_id: OTHER_ID, // someone else's message
            conversation_id: CONV_ID,
            hospital_id: HOSP_ID,
          },
          error: null,
        },
        { data: null, error: null }, // update
      )

      await expect(deleteMessageAction(MSG_ID)).resolves.toBeUndefined()
    })

    it('allows PLATFORM_ADMIN to delete messages across any hospital', async () => {
      mockRequireAuth.mockResolvedValue(platformAdminContext())

      setNextServiceResults(
        {
          data: {
            id: MSG_ID,
            sender_id: OTHER_ID,
            conversation_id: CONV_ID,
            hospital_id: HOSP_ID_B, // different hospital — platform admin can cross
          },
          error: null,
        },
        { data: null, error: null },
      )

      await expect(deleteMessageAction(MSG_ID)).resolves.toBeUndefined()
    })

    it('returns an error when the soft-delete DB call fails', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        {
          data: {
            id: MSG_ID,
            sender_id: OTHER_ID,
            conversation_id: CONV_ID,
            hospital_id: HOSP_ID,
          },
          error: null,
        },
        { data: null, error: { message: 'update failed' } }, // update fails
      )

      await expect(deleteMessageAction(MSG_ID)).rejects.toThrow('Failed to delete message.')
    })
  })
})

// ===========================================================================
// addMemberAction
// ===========================================================================

describe('addMemberAction', () => {
  describe('when user has no hospital_id', () => {
    it('returns an error', async () => {
      mockRequireAuth.mockResolvedValue({
        ...doctorContext(),
        profile: { ...doctorContext().profile, hospital_id: null },
      })

      const fd = makeFormData({ conversation_id: CONV_ID, user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toEqual({ error: 'No hospital assigned to your account.' })
    })
  })

  describe('admin-only guard', () => {
    it('returns an error when a non-admin tries to add a member', async () => {
      // Actor is DOCTOR, not admin
      const fd = makeFormData({ conversation_id: CONV_ID, user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toEqual({
        error: 'You do not have permission to add members to conversations.',
      })
    })

    it('allows HOSPITAL_ADMIN to add a member', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        // conversation hospital check
        { data: { id: CONV_ID }, error: null },
        // insert member
        { data: null, error: null },
      )

      const fd = makeFormData({ conversation_id: CONV_ID, user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toBeNull()
    })
  })

  describe('schema validation', () => {
    it('returns an error for an invalid conversation_id', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      const fd = makeFormData({ conversation_id: 'bad-id', user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toHaveProperty('error')
    })

    it('returns an error for an invalid user_id', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      const fd = makeFormData({ conversation_id: CONV_ID, user_id: 'not-a-uuid' })
      const result = await addMemberAction(null, fd)
      expect(result).toHaveProperty('error')
    })
  })

  describe('conversation hospital check', () => {
    it('returns an error when the conversation belongs to a different hospital', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      // Conversation not found under actor's hospitalId
      setNextServiceResults({ data: null, error: null })

      const fd = makeFormData({ conversation_id: CONV_ID, user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toEqual({ error: 'Conversation not found.' })
    })
  })

  describe('duplicate member handling', () => {
    it('returns a user-friendly error when user is already a member', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        // conversation lookup
        { data: { id: CONV_ID }, error: null },
        // insert member — unique constraint violation
        { data: null, error: { message: 'duplicate key', code: '23505' } },
      )

      const fd = makeFormData({ conversation_id: CONV_ID, user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toEqual({
        error: 'User is already a member of this conversation.',
      })
    })

    it('returns a generic error for other DB failures on member insert', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        { data: { id: CONV_ID }, error: null },
        { data: null, error: { message: 'connection error', code: '08000' } },
      )

      const fd = makeFormData({ conversation_id: CONV_ID, user_id: OTHER_ID })
      const result = await addMemberAction(null, fd)
      expect(result).toEqual({ error: 'Failed to add member. Please try again.' })
    })
  })
})

// ===========================================================================
// removeMemberAction
// ===========================================================================

describe('removeMemberAction', () => {
  describe('when user has no hospital_id', () => {
    it('throws an error', async () => {
      mockRequireAuth.mockResolvedValue({
        ...doctorContext(),
        profile: { ...doctorContext().profile, hospital_id: null },
      })

      await expect(removeMemberAction(CONV_ID, OTHER_ID)).rejects.toThrow(
        'No hospital assigned to your account.'
      )
    })
  })

  describe('authorization: isSelf or isAdmin', () => {
    it('allows a user to remove themselves', async () => {
      // Actor removes themselves (userId === userId)
      setNextServiceResults(
        // conversation lookup
        { data: { id: CONV_ID }, error: null },
        // delete member
        { data: null, error: null },
      )

      await expect(removeMemberAction(CONV_ID, USER_ID)).resolves.toBeUndefined()
    })

    it('prevents a non-admin from removing another user', async () => {
      // Actor is DOCTOR trying to remove OTHER_ID (not self, not admin)
      await expect(removeMemberAction(CONV_ID, OTHER_ID)).rejects.toThrow(
        'You do not have permission to remove this member.'
      )
    })

    it('allows HOSPITAL_ADMIN to remove any member', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        { data: { id: CONV_ID }, error: null },
        { data: null, error: null },
      )

      await expect(removeMemberAction(CONV_ID, OTHER_ID)).resolves.toBeUndefined()
    })
  })

  describe('conversation hospital check', () => {
    it('throws when the conversation belongs to a different hospital', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      // Conversation not found in actor's hospital
      setNextServiceResults({ data: null, error: null })

      await expect(removeMemberAction(CONV_ID, OTHER_ID)).rejects.toThrow(
        'Conversation not found.'
      )
    })
  })

  describe('DB error handling', () => {
    it('throws when the delete operation fails', async () => {
      mockRequireAuth.mockResolvedValue(hospitalAdminContext())

      setNextServiceResults(
        { data: { id: CONV_ID }, error: null },
        { data: null, error: { message: 'delete failed' } },
      )

      await expect(removeMemberAction(CONV_ID, OTHER_ID)).rejects.toThrow(
        'Failed to remove member.'
      )
    })
  })
})

// ===========================================================================
// getAttachmentUrlAction
// ===========================================================================

describe('getAttachmentUrlAction', () => {
  const validPath = `${HOSP_ID}/conv/image.png`
  const crossTenantPath = `${HOSP_ID_B}/conv/image.png`

  describe('auth enforcement', () => {
    it('requires authentication (requireAuth is called)', async () => {
      storageMockResult = { data: { signedUrl: 'https://signed.url/image.png' } }

      await getAttachmentUrlAction(validPath)
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
    })
  })

  describe('hospital path prefix enforcement', () => {
    it('returns null for a path that does not start with hospitalId/', async () => {
      const result = await getAttachmentUrlAction(crossTenantPath)
      expect(result).toBeNull()
    })

    it('returns null for a path with no hospital prefix at all', async () => {
      const result = await getAttachmentUrlAction('random/path/image.png')
      expect(result).toBeNull()
    })

    it('returns null when actor has no hospital_id', async () => {
      mockRequireAuth.mockResolvedValue({
        ...doctorContext(),
        profile: { ...doctorContext().profile, hospital_id: null },
      })

      const result = await getAttachmentUrlAction(validPath)
      expect(result).toBeNull()
    })

    it('returns the signed URL for a path with the correct hospital prefix', async () => {
      storageMockResult = { data: { signedUrl: 'https://storage.example.com/signed' } }

      const result = await getAttachmentUrlAction(validPath)
      expect(result).toBe('https://storage.example.com/signed')
    })

    it('returns null when storage.createSignedUrl returns no data', async () => {
      storageMockResult = { data: null }

      const result = await getAttachmentUrlAction(validPath)
      expect(result).toBeNull()
    })
  })

  describe('PLATFORM_ADMIN cross-tenant access', () => {
    it('allows PLATFORM_ADMIN to access any hospital storage path', async () => {
      mockRequireAuth.mockResolvedValue(platformAdminContext())
      storageMockResult = { data: { signedUrl: 'https://storage.example.com/other' } }

      const result = await getAttachmentUrlAction(crossTenantPath)
      expect(result).toBe('https://storage.example.com/other')
    })
  })
})

// ===========================================================================
// sendMessageAction — additional coverage for lines 201 and 282
// ===========================================================================

describe('sendMessageAction — edge cases', () => {
  describe('malformed attachment metadata (line 201)', () => {
    it('returns an error when an attachment entry has a non-string storagePath', async () => {
      // This bypasses the JSON parse and array check, reaching the type-guard at line 195
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify([
          {
            storagePath: 12345, // number instead of string — type coercion bypass
            fileName: 'file.png',
            fileSize: 100,
            mimeType: 'image/png',
          },
        ]),
      })
      const result = await sendMessageAction(null, fd)
      expect((result as { error: string }).error).toBeTruthy()
    })

    it('returns an error when an attachment entry has a non-number fileSize', async () => {
      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Hi',
        attachment_paths: JSON.stringify([
          {
            storagePath: `${HOSP_ID}/file.png`,
            fileName: 'file.png',
            fileSize: '100', // string instead of number
            mimeType: 'image/png',
          },
        ]),
      })
      const result = await sendMessageAction(null, fd)
      expect((result as { error: string }).error).toBeTruthy()
    })
  })

  describe('attachment insert failure (line 282)', () => {
    it('logs a console error but still returns messageId when attachment insert fails', async () => {
      // The action logs the error and continues (non-fatal)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      setNextServerResult({ data: { id: 'member-row-id' }, error: null })
      setNextServiceResults(
        // message insert — succeeds
        { data: { id: MSG_ID }, error: null },
        // attachment insert — fails
        { data: null, error: { message: 'attachment insert failed' } },
        // last_message_at update
        { data: null, error: null },
      )

      const validAttachment = JSON.stringify([
        {
          storagePath: `${HOSP_ID}/conv/file.png`,
          fileName: 'file.png',
          fileSize: 512,
          mimeType: 'image/png',
        },
      ])

      const fd = makeFormData({
        conversation_id: CONV_ID,
        content: 'Message with attachment',
        attachment_paths: validAttachment,
      })

      const result = await sendMessageAction(null, fd)
      // Non-fatal: message was created, messageId is returned
      expect(result).toEqual({ messageId: MSG_ID })
      // The error path is logged
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})

// ===========================================================================
// markReadAction
// ===========================================================================

import { markReadAction } from '../actions'

describe('markReadAction', () => {
  it('calls requireAuth and updates last_read_at for the conversation', async () => {
    setNextServiceResults({ data: null, error: null })

    await expect(markReadAction(CONV_ID)).resolves.toBeUndefined()
    expect(mockRequireAuth).toHaveBeenCalledTimes(1)
  })

  it('does not throw when the DB update returns an error (fire-and-forget)', async () => {
    // The action does not check for errors on this update — it is best-effort
    setNextServiceResults({ data: null, error: { message: 'update failed' } })

    await expect(markReadAction(CONV_ID)).resolves.toBeUndefined()
  })
})
