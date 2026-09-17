import { describe, expect, it } from 'vitest'
import { resolveFacedown, FACEDOWN_META, type FacedownEffect } from './facedown-config'
import { facedownResolver } from './facedown-resolver'

const fd: FacedownEffect = { kind: 'facedown' }

describe('facedown effect', () => {
  it('meta', () => {
    expect(FACEDOWN_META.kind).toBe('facedown')
    expect(FACEDOWN_META.priority).toBe(1)
  })
  it('face-down: brighter fill + glow + custom class', () => {
    const m = resolveFacedown(undefined)
    expect(m.color).toContain('var(--surface-sunk)')
    expect(m.glow).toContain('var(--primary)')
    expect(m.customClass).toBe('coin-face--facedown')
  })
  it('H face: no-op', () => {
    expect(resolveFacedown('H')).toEqual({})
  })
  it('T face: no-op', () => {
    expect(resolveFacedown('T')).toEqual({})
  })
  it('resolver delegates', () => {
    expect(facedownResolver(fd, undefined)).toEqual(resolveFacedown(undefined))
  })
})
