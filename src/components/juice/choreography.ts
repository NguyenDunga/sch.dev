// Scoring choreography (13.3) — pure logic for the 7-beat dopamine loop
// (SDD UX §6). Plays over lastScore; never mutates state, never decides an
// outcome (UX §0) — the numbers come from the store's Score; this module
// only paces the presentation.
//
// Beats: 0 idle → 1 reveal/match → 2 tier banner → 3 chips build →
//        4 mult flare → 5 resolve → 6 cash fly → 7 settle (the end).
// A skip snaps to beat 7 (the settled end) and changes no number (13.4).

import type { CharmId, Coin, Face, Option, Play, Score, TierId } from '@/core/types'
import { isFilled } from '@/core/helpers'
import { TIERS } from '@/core/balance'

/** The choreography beats (0 = idle, 7 = the settled end). */
export type Beat = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/** A visual snapshot of the tossed play, captured at the Score tap (the
 *  store empties the play synchronously, so the overlay carries its own
 *  copy — presentational data only; the faces are already store-resolved). */
export interface SnapshotCoin {
  coin: Coin
  face: Face
}

export interface PlaySnapshot {
  coins: SnapshotCoin[]
  charms: CharmId[]
}

/** One scoring sequence: the store's Score + the visual snapshot + a run id
 *  (a remount key so each hand's counters start from zero). */
export interface ChoroSeq {
  runId: number
  score: Score
  snapshot: PlaySnapshot | null
}

/** Capture the filled play slots (in order) + the owned charms. */
export function takeSnapshot(play: Play, charms: CharmId[]): PlaySnapshot {
  return {
    coins: play.filter(isFilled).map((s) => ({ coin: s.coin, face: s.face })),
    charms: [...charms],
  }
}

/** The indices (in coin order) of the coins forming the matched pattern
 *  (beat 1: these pulse + glow in the tier color; the others dim). */
export function matchedIndices(coins: SnapshotCoin[], tier: Option<TierId>): number[] {
  if (!tier.some || coins.length === 0) return []
  const faces = coins.map((c) => c.face)
  switch (tier.value) {
    case 'jackpot':
    case 'alternating':
      return faces.map((_, i) => i)
    case 'fourRow':
    case 'tripleRun': {
      const need = tier.value === 'fourRow' ? 4 : 3
      let best: number[] = []
      let run: number[] = []
      for (let i = 0; i < faces.length; i++) {
        if (i > 0 && faces[i] === faces[i - 1]) run.push(i)
        else run = [i]
        if (run.length >= need && run.length > best.length) best = [...run]
      }
      return best
    }
    case 'fourSame':
    case 'threeSame': {
      const need = tier.value === 'fourSame' ? 4 : 3
      const counts: Record<Face, number> = { H: 0, T: 0 }
      for (const f of faces) counts[f]++
      const face: Face = counts.H >= counts.T ? 'H' : 'T'
      const out: number[] = []
      for (let i = 0; i < faces.length && out.length < need; i++) {
        if (faces[i] === face) out.push(i)
      }
      return out
    }
  }
}

/** The active tier's color token (tier banners / highlights, UX §2). */
export const TIER_COLOR_VAR: Record<TierId, string> = {
  jackpot: 'var(--tier-jackpot)',
  fourRow: 'var(--tier-four-row)',
  alternating: 'var(--tier-alternating)',
  fourSame: 'var(--tier-four-same)',
  tripleRun: 'var(--tier-triple-run)',
  threeSame: 'var(--tier-three-same)',
}

/** Tier rank (high → low) — escalation: bigger outcomes get bigger juice. */
export const TIER_RANK: Record<TierId, number> = {
  jackpot: 5,
  fourRow: 4,
  alternating: 3,
  fourSame: 2,
  tripleRun: 1,
  threeSame: 0,
}

/** A "big hit" (UX §6 beat 5: --primary flash; §7: bigger shake). */
export function isBigHit(tier: TierId): boolean {
  return TIER_RANK[tier] >= 3
}

/** The tier banner text (beat 2): "JACKPOT!" / the tier name / "No match". */
export function bannerText(score: Score): string {
  if (score.kind !== 'scored') return 'No match'
  if (score.tier === 'jackpot') return 'JACKPOT!'
  return TIERS.find((t) => t.id === score.tier)!.name.toUpperCase()
}

/** Per-beat durations in ms (UX §6: ~500–700ms chips, ~200ms mult,
 *  ~500–900ms resolve; 70ms reveal stagger; 220ms banner + 120ms flash;
 *  250ms cash-fly each). The budget scales with score size and is capped
 *  (additive but capped, UX §6). Reduced motion (UX §8): fast counters
 *  (≤150ms), no long beats. */
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

/** The coins that pay cash (Tax/Jackpot) — one cash coin flies per one
 *  (beat 6). A merged coin carrying both effects still flies once. */
export function cashCoinCount(coins: SnapshotCoin[]): number {
  return coins.filter((c) => c.coin.effects.some((e) => e.kind === 'tax' || e.kind === 'jackpot')).length
}

/** The chips that fly to the chips counter (beat 3): one per contributing
 *  coin (the matched pattern) + one per contributing scoring charm
 *  (plusChips / plusMult / jackpotFever on a jackpot), capped at 12. */
export function chipCount(score: Score, matched: number[], charms: CharmId[]): number {
  if (score.kind !== 'scored') return 0
  const contributing = charms.filter(
    (c) => c === 'plusChips' || c === 'plusMult' || (c === 'jackpotFever' && score.tier === 'jackpot'),
  )
  return Math.min(12, matched.length + contributing.length)
}
