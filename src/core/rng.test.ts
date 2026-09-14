import { describe, expect, it } from 'vitest'
import { createRng, xmur3 } from './rng'

describe('xmur3', () => {
  it('same string → same hash', () => {
    expect(xmur3('ab12cd')()).toBe(xmur3('ab12cd')())
  })

  it('different strings → different hashes', () => {
    expect(xmur3('ab12cd')()).not.toBe(xmur3('ab12ce')())
  })
})

describe('createRng', () => {
  it('same seed → same sequence', () => {
    const a = createRng('ab12cd')
    const b = createRng('ab12cd')
    const seqA = Array.from({ length: 32 }, () => a.next())
    const seqB = Array.from({ length: 32 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('different seed → different sequence', () => {
    const a = createRng('ab12cd')
    const b = createRng('ab12ce')
    const seqA = Array.from({ length: 32 }, () => a.next())
    const seqB = Array.from({ length: 32 }, () => b.next())
    expect(seqA).not.toEqual(seqB)
  })

  it('next() returns floats in [0, 1)', () => {
    const rng = createRng('ab12cd')
    for (let i = 0; i < 1000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('state() serializes to 4 int32s (xoroshiro128+)', () => {
    const rng = createRng('ab12cd')
    rng.next()
    const s = rng.state()
    expect(s).toHaveLength(4)
    expect(
      s.every((n) => Number.isInteger(n) && n >= -0x80000000 && n <= 0x7fffffff),
    ).toBe(true)
  })
})
