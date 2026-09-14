import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus'

/**
 * xmur3 — 32-bit string hash (jcalin's algorithm, vendored; pure-rand ships
 * no string hash). Maps a seed string to a uint32 for the PRNG.
 */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h + (h << 13)) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

export interface Rng {
  /** Next float in [0, 1). Advances the generator. */
  next: () => number
  /** Serialized state (4 × int32) for save/resume. */
  state: () => number[]
}

/** Seed string → deterministic run RNG (same seed = same sequence). */
export function createRng(seed: string): Rng {
  const rng = xoroshiro128plus(xmur3(seed)())
  return {
    next: () => (rng.next() >>> 0) / 0x100000000,
    state: () => [...rng.getState()],
  }
}
