import { describe, expect, it } from 'vitest'
import { resolveMagnetic, MAGNETIC_META } from './magnetic-config'
import { magneticResolver } from './magnetic-resolver'
describe('magnetic effect', () => {
  it('meta', () => { expect(MAGNETIC_META.priority).toBe(6) })
  it('solid border + scale', () => {
    const r = resolveMagnetic()
    expect(r.border).toContain('solid')
    expect(r.scale).toBe(1.05)
  })
  it('resolver delegates', () => { expect(magneticResolver()).toEqual(resolveMagnetic()) })
})
