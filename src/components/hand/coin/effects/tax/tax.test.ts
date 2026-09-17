import { describe, expect, it } from 'vitest'
import { resolveTax, TAX_META } from './tax-config'
import { taxResolver } from './tax-resolver'
describe('tax effect', () => {
  it('meta', () => { expect(TAX_META.priority).toBe(8) })
  it('red tint', () => {
    const m = resolveTax()
    expect(m.color).toContain('var(--danger)')
  })
  it('resolver delegates', () => { expect(taxResolver()).toEqual(resolveTax()) })
})
