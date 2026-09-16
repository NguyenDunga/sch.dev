import { describe, expect, it } from 'vitest'
import { resolveJackpot, JACKPOT_META } from './jackpot-config'
import { jackpotResolver } from './jackpot-resolver'
describe('jackpot effect', () => {
  it('meta', () => { expect(JACKPOT_META.priority).toBe(9) })
  it('gold glow + scale + border', () => {
    const m = resolveJackpot()
    expect(m.color).toContain('var(--tier-jackpot)')
    expect(m.glow).toContain('var(--tier-jackpot)')
    expect(m.scale).toBe(1.1)
    expect(m.border).toContain('var(--tier-jackpot)')
  })
  it('resolver delegates', () => { expect(jackpotResolver()).toEqual(resolveJackpot()) })
})
