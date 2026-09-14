import { describe, expect, it } from 'vitest'
import { chance, createRng, generateSeed, intBetween, xmur3 } from './rng'

describe('xmur3', () => {
  it('same string → same hash', () => {
    expect(xmur3('ab12cd')()).toBe(xmur3('ab12cd')())
  })

  it('different strings → different hashes', () => {
    expect(xmur3('ab12cd')()).not.toBe(xmur3('ab12ce')())
  })
})

describe('createRng', () => {
  it('same seed → identical sequence (100 draws)', () => {
    const a = createRng('ab12cd')
    const b = createRng('ab12cd')
    const seqA = Array.from({ length: 100 }, () => a.next())
    const seqB = Array.from({ length: 100 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('different seed → different sequence', () => {
    const a = createRng('ab12cd')
    const b = createRng('ab12ce')
    const seqA = Array.from({ length: 100 }, () => a.next())
    const seqB = Array.from({ length: 100 }, () => b.next())
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

  it('state()/restore() round-trip: continuation matches (backs save/resume)', () => {
    const a = createRng('ab12cd')
    for (let i = 0; i < 37; i++) a.next()
    const snapshot = a.state()
    const b = createRng('other-seed')
    b.restore(snapshot)
    const seqA = Array.from({ length: 100 }, () => a.next())
    const seqB = Array.from({ length: 100 }, () => b.next())
    expect(seqB).toEqual(seqA)
  })
})

describe('generateSeed', () => {
  it('matches /^[A-Za-z0-9]{6,8}$/', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSeed()).toMatch(/^[A-Za-z0-9]{6,8}$/)
    }
  })

  it('varies across calls', () => {
    const seeds = new Set(Array.from({ length: 50 }, () => generateSeed()))
    expect(seeds.size).toBeGreaterThan(1)
  })
})

describe('derived draws (from next() — no second RNG)', () => {
  it('chance(rng, 0.25) over 10,000 draws lands within ±3% of 0.25', () => {
    const rng = createRng('ab12cd')
    let hits = 0
    for (let i = 0; i < 10_000; i++) if (chance(rng, 0.25)) hits++
    const rate = hits / 10_000
    expect(rate).toBeGreaterThanOrEqual(0.22)
    expect(rate).toBeLessThanOrEqual(0.28)
  })

  it('intBetween(rng, min, max) stays in range and covers every value', () => {
    const rng = createRng('ab12cd')
    const seen = new Set<number>()
    for (let i = 0; i < 10_000; i++) {
      const n = intBetween(rng, 0, 5)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(5)
      seen.add(n)
    }
    expect(seen.size).toBe(6)
  })
})
