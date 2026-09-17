import { describe, expect, it } from 'vitest'
import { resolveChaos, CHAOS_META } from './chaos-config'
import { chaosResolver } from './chaos-resolver'
describe('chaos effect', () => {
  it('meta', () => { expect(CHAOS_META.priority).toBe(4) })
  it('dashed border + class', () => {
    const m = resolveChaos()
    expect(m.border).toContain('dashed')
    expect(m.customClass).toBe('coin-face--chaos')
  })
  it('resolver delegates', () => { expect(chaosResolver()).toEqual(resolveChaos()) })
})
