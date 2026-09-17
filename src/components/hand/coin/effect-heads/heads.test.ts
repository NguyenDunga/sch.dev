import { describe, expect, it } from 'vitest'
import { resolveHeads, HEADS_META, type HeadsEffect } from './heads-config'
import { headsResolver } from './heads-resolver'

const heads: HeadsEffect = { kind: 'heads' }

describe('heads effect', () => {
  it('meta', () => {
    expect(HEADS_META.kind).toBe('heads')
    expect(HEADS_META.priority).toBe(3)
  })
  it('H face: lightened fill + heads glow', () => {
    const m = resolveHeads('H')
    expect(m.color).toContain('var(--heads)')
    expect(m.glow).toContain('var(--heads)')
  })
  it('T face: no-op', () => {
    expect(resolveHeads('T')).toEqual({})
  })
  it('face-down: no-op', () => {
    expect(resolveHeads(undefined)).toEqual({})
  })
  it('resolver delegates', () => {
    expect(headsResolver(heads, 'H')).toEqual(resolveHeads('H'))
  })
})
