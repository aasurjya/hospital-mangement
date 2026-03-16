import { AI_CONFIG } from '../config'

describe('AI_CONFIG', () => {
  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(AI_CONFIG)).toBe(true)
  })

  it('has expected model', () => {
    expect(AI_CONFIG.MODEL).toBe('claude-sonnet-4-6-20250514')
  })

  it('has rate limit of 10 per hour', () => {
    expect(AI_CONFIG.RATE_LIMIT_PER_HOUR).toBe(10)
  })

  it('has max output tokens of 4096', () => {
    expect(AI_CONFIG.MAX_OUTPUT_TOKENS).toBe(4096)
  })

  it('has max input length of 10000', () => {
    expect(AI_CONFIG.MAX_INPUT_LENGTH).toBe(10000)
  })

  it('has max medications count of 20', () => {
    expect(AI_CONFIG.MAX_MEDICATIONS_COUNT).toBe(20)
  })
})
