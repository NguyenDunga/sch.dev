import { describe, expect, it } from 'vitest'
import { resolveReverse, REVERSE_META } from './reverse-config'
import { reverseResolver } from './reverse-resolver'
describe('reverse effect', () => {
  it('meta', () => { expect(REVERSE_META.priority).toBe(7) })
  it('hue-invert class', () => {
    const m = resolveReverse()
    expect(m.customClass).toBe('coin-face--reverse')
  })
  it('resolver delegates', () => { expect(reverseResolver()).toEqual(resolveReverse()) })
})
