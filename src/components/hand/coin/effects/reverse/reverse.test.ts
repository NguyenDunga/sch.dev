import { describe, expect, it } from 'vitest'
import { resolveReverse, REVERSE_META } from './reverse-config'
import { reverseResolver } from './reverse-resolver'
describe('reverse effect', () => {
  it('meta', () => { expect(REVERSE_META.priority).toBe(7) })
  it('negative tilt + class', () => {
    const m = resolveReverse()
    expect(m.tilt).toBe(-8)
    expect(m.customClass).toBe('coin-face--reverse')
  })
  it('resolver delegates', () => { expect(reverseResolver()).toEqual(resolveReverse()) })
})
