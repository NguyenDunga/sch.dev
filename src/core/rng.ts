import { xoroshiro128plus, xoroshiro128plusFromState } from 'pure-rand/generator/xoroshiro128plus'

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
  /** Restore a serialized state (save/resume — the run continues the same sequence). */
  restore: (s: number[]) => void
}

/** Seed string → deterministic run RNG (same seed = same sequence). */
export function createRng(seed: string): Rng {
  let rng = xoroshiro128plus(xmur3(seed)())
  return {
    next: () => (rng.next() >>> 0) / 0x100000000,
    state: () => [...rng.getState()],
    restore: (s) => {
      rng = xoroshiro128plusFromState(s)
    },
  }
}

// Derived draws — everything derives from next() (no second RNG, WBS M2).

/** Boolean draw at probability p (e.g. the Jackpot 25% chance roll). */
export const chance = (rng: Rng, p: number): boolean => rng.next() < p

/** Uniform int in [min, max] (inclusive). */
export const intBetween = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng.next() * (max - min + 1))

const SEED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Random 6–8 char seed ([A-Za-z0-9]) for the menu's random-seed button.
 * The one non-deterministic entry point: it bootstraps the seed, so it uses
 * platform entropy (crypto.getRandomValues) — core/state must not use the
 * global random (M14 grep check).
 */
export function generateSeed(): string {
  const buf = new Uint32Array(9)
  crypto.getRandomValues(buf)
  const len = 6 + (buf[0] % 3)
  let seed = ''
  for (let i = 0; i < len; i++) seed += SEED_CHARS[buf[i + 1] % SEED_CHARS.length]
  return seed
}
