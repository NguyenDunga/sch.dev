// Priority tint — the RadialReveal wedge color lightness by priority rank.
//
// A coin's ring has one wedge per NON-top effect. Each wedge's color is the
// effect's base color tinted by its priority rank among the coin's ACTIVE
// effects: low priority → lighter (more white mixed in), high priority →
// darker (full color). The top effect (highest rank) is the darkest (it is the
// disk default, not a wedge).
//
// The rank is the effect's index when the coin's effects are sorted by
// priority (0 = lowest). Tied priorities share a rank (same tint). Pure
// function: same input → same output.

import type { CoinEffect } from '@/core/types'
import { PRIORITY } from '../resolver/resolver-piority'

/** The lightest tint (most white) — the lowest-priority effect. */
const MIN_STRENGTH = 70
/** The darkest tint (full color) — the highest-priority effect. */
const MAX_STRENGTH = 100

/**
 * The color strength (0–100) for an effect, by its priority rank among the
 * coin's active effects. 100 = full color (no tint); lower = lighter (more
 * white). A single-effect coin (or the top effect) is always 100.
 */
export function priorityStrength(effects: CoinEffect[], effect: CoinEffect): number {
  const n = effects.length
  if (n <= 1) return MAX_STRENGTH
  const rank = effects.filter((e) => PRIORITY[e.kind] < PRIORITY[effect.kind]).length
  return Math.round(MIN_STRENGTH + (MAX_STRENGTH - MIN_STRENGTH) * (rank / (n - 1)))
}

/** Apply a strength to a base color: mix it with white (100 = unchanged). */
export function priorityTint(base: string, strength: number): string {
  return strength >= MAX_STRENGTH ? base : `color-mix(in srgb, ${base} ${strength}%, white)`
}
