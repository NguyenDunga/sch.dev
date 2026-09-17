import { describe, expect, it } from 'vitest'
import { resolveMagnetic, MAGNETIC_META } from './magnetic-config'
import { magneticResolver } from './magnetic-resolver'
describe('magnetic effect', () => {
  it('meta', () => { expect(MAGNETIC_META.priority).toBe(6) })
  it('solid border', () => {
    const r = resolveMagnetic()
    expect(r.border).toContain('solid')
  })
  it('resolver delegates', () => { expect(magneticResolver()).toEqual(resolveMagnetic()) })
})
