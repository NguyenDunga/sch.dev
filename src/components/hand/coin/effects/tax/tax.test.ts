import { describe, expect, it } from 'vitest'
import { resolveTax, TAX_META } from './tax-config'
import { taxResolver } from './tax-resolver'
describe('tax effect', () => {
  it('meta', () => { expect(TAX_META.priority).toBe(8) })
  it('red tint + scale down', () => {
    const m = resolveTax()
    expect(m.color).toContain('var(--danger)')
    expect(m.scale).toBe(0.9)
  })
  it('resolver delegates', () => { expect(taxResolver()).toEqual(resolveTax()) })
})
