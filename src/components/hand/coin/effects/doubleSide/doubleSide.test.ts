import { describe, expect, it } from 'vitest'
import { resolveDoubleSide, DOUBLE_SIDE_META, type DoubleSideEffect } from './doubleSide-config'
import { doubleSideResolver } from './doubleSide-resolver'

const dsH: DoubleSideEffect = { kind: 'doubleSide', favored: 'H' }

describe('doubleSide effect', () => {
  it('meta', () => {
    expect(DOUBLE_SIDE_META.kind).toBe('doubleSide')
    expect(DOUBLE_SIDE_META.priority).toBe(3)
  })
  it('H favored, H face: strong tilt + glow', () => {
    const m = resolveDoubleSide(dsH, 'H')
    expect(m.tilt).toBe(18)
    expect(m.glow).toContain('var(--heads)')
  })
  it('H favored, T face: scale down', () => {
    const m = resolveDoubleSide(dsH, 'T')
    expect(m.scale).toBe(0.95)
  })
  it('resolver delegates', () => {
    expect(doubleSideResolver(dsH, 'H')).toEqual(resolveDoubleSide(dsH, 'H'))
  })
})
