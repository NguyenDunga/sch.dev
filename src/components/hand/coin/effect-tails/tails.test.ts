import { describe, expect, it } from 'vitest'
import { resolveTails, TAILS_META, type TailsEffect } from './tails-config'
import { tailsResolver } from './tails-resolver'

const tails: TailsEffect = { kind: 'tails' }

describe('tails effect', () => {
  it('meta', () => {
    expect(TAILS_META.kind).toBe('tails')
    expect(TAILS_META.priority).toBe(3)
  })
  it('T face: lightened fill + tails glow', () => {
    const m = resolveTails('T')
    expect(m.color).toContain('var(--tails)')
    expect(m.glow).toContain('var(--tails)')
  })
  it('H face: no-op', () => {
    expect(resolveTails('H')).toEqual({})
  })
  it('face-down: no-op', () => {
    expect(resolveTails(undefined)).toEqual({})
  })
  it('resolver delegates', () => {
    expect(tailsResolver(tails, 'T')).toEqual(resolveTails('T'))
  })
})
