import { bulkRoomSchema, updateRoomSchema, bulkToggleSchema } from '../schemas'

describe('bulkRoomSchema', () => {
  const valid = {
    room_type: 'ICU',
    floor: '3',
    prefix: 'ICU-',
    quantity: 5,
    notes: 'New wing',
  }

  it('accepts valid input', () => {
    expect(bulkRoomSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts without optional fields', () => {
    const { floor, notes, ...required } = valid
    expect(bulkRoomSchema.safeParse(required).success).toBe(true)
  })

  it('rejects invalid room_type', () => {
    const result = bulkRoomSchema.safeParse({ ...valid, room_type: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('rejects empty prefix', () => {
    const result = bulkRoomSchema.safeParse({ ...valid, prefix: '' })
    expect(result.success).toBe(false)
  })

  it('rejects quantity below 1', () => {
    const result = bulkRoomSchema.safeParse({ ...valid, quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects quantity above 50', () => {
    const result = bulkRoomSchema.safeParse({ ...valid, quantity: 51 })
    expect(result.success).toBe(false)
  })

  it('coerces string quantity to number', () => {
    const result = bulkRoomSchema.safeParse({ ...valid, quantity: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quantity).toBe(10)
    }
  })

  it('accepts boundary quantity 1', () => {
    expect(bulkRoomSchema.safeParse({ ...valid, quantity: 1 }).success).toBe(true)
  })

  it('accepts boundary quantity 50', () => {
    expect(bulkRoomSchema.safeParse({ ...valid, quantity: 50 }).success).toBe(true)
  })
})

describe('updateRoomSchema', () => {
  const valid = {
    room_number: 'ICU-01',
    room_type: 'ICU',
    floor: '2',
    notes: 'Renovated',
    is_available: 'on',
    is_active: 'on',
  }

  it('accepts valid input', () => {
    expect(updateRoomSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty room_number', () => {
    const result = updateRoomSchema.safeParse({ ...valid, room_number: '' })
    expect(result.success).toBe(false)
  })

  it('rejects room_number over 50 chars', () => {
    const result = updateRoomSchema.safeParse({ ...valid, room_number: 'A'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('accepts without optional fields', () => {
    const result = updateRoomSchema.safeParse({
      room_number: 'R-01',
      room_type: 'GENERAL',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid room_type', () => {
    const result = updateRoomSchema.safeParse({ ...valid, room_type: 'LUXURY' })
    expect(result.success).toBe(false)
  })
})

describe('bulkToggleSchema', () => {
  const validUUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

  it('accepts valid input', () => {
    const result = bulkToggleSchema.safeParse({
      room_ids: [validUUID],
      is_available: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty room_ids array', () => {
    const result = bulkToggleSchema.safeParse({
      room_ids: [],
      is_available: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 50 room_ids', () => {
    const ids = Array.from({ length: 51 }, () => validUUID)
    const result = bulkToggleSchema.safeParse({
      room_ids: ids,
      is_available: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID room_ids', () => {
    const result = bulkToggleSchema.safeParse({
      room_ids: ['not-a-uuid'],
      is_available: true,
    })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 50 room_ids', () => {
    const ids = Array.from({ length: 50 }, () => validUUID)
    const result = bulkToggleSchema.safeParse({
      room_ids: ids,
      is_available: false,
    })
    expect(result.success).toBe(true)
  })

  it('requires is_available to be boolean', () => {
    const result = bulkToggleSchema.safeParse({
      room_ids: [validUUID],
      is_available: 'true',
    })
    expect(result.success).toBe(false)
  })
})
