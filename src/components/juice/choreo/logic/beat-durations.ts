// 13.3 — per-beat durations for the scoring choreography (SDD UX §6).
//
// Per-beat durations in ms (UX §6: ~500–700ms chips, ~200ms mult,
// ~500–900ms resolve; 70ms reveal stagger; 220ms banner + 120ms flash;
// 250ms cash-fly each). The budget scales with score size and is capped
// (additive but capped, UX §6). Reduced motion (UX §8): fast counters
// (≤150ms), no long beats.

import type { Score } from '@/core/types'

export interface BeatDurations {
  reveal: number
  banner: number
  chips: number
  mult: number
  resolve: number
  cash: number
  settle: number
}

/** The total score-beats budget (UX §5: ~1.2–2.4s). */
export const BEAT_BUDGET_MS = 2400

/** The post-resolve rest: once the score calculation is done (the beat-5
 *  total has counted up), the final numbers rest on screen for this long
 *  before the animation ends (the cash fly + settle follow). A fixed pause,
 *  not a beat — it is not part of the beat budget. Reduced motion (UX §8):
 *  no rest — the fast sequence stays fast. */
export const REST_MS = 400

const REDUCED_DURATIONS: BeatDurations = {
  reveal: 150,
  banner: 150,
  chips: 150,
  mult: 100,
  resolve: 150,
  cash: 150,
  settle: 100,
}

export function beatDurations(score: Score, nCoins: number, cashCoins: number, reduced: boolean): BeatDurations {
  if (reduced) return REDUCED_DURATIONS
  const scored = score.kind === 'scored'
  const d: BeatDurations = {
    reveal: Math.min(450, nCoins * 70 + 200), // 70ms stagger + the match pulse
    banner: 340, // 220ms slam + 120ms tier flash
    chips: scored ? 500 + Math.min(200, score.chips) : 0,
    mult: scored ? 200 : 0,
    resolve: scored ? 500 + Math.min(400, Math.floor(score.total / 10)) : 0,
    cash: score.cash > 0 ? 250 + Math.max(1, Math.min(cashCoins, 5)) * 80 : 0,
    settle: 200,
  }
  const sum = d.reveal + d.banner + d.chips + d.mult + d.resolve + d.cash + d.settle
  if (sum <= BEAT_BUDGET_MS) return d
  const k = BEAT_BUDGET_MS / sum
  return {
    reveal: Math.floor(d.reveal * k),
    banner: Math.floor(d.banner * k),
    chips: Math.floor(d.chips * k),
    mult: Math.floor(d.mult * k),
    resolve: Math.floor(d.resolve * k),
    cash: Math.floor(d.cash * k),
    settle: Math.floor(d.settle * k),
  }
}
