// C3 — Scoring pipeline.
//
// M4 ships the hand-phase state machine (C4) and calls C3 through its final
// signatures, so the store never changes when the real pipeline lands. Current
// state:
//   - resolveFace: real (M7) — odds stage → roll → Reverse
//   - matchTier:   real (M5) — highest-value tier on the tossed coins
//   - scoreHand:   real (M6) — tier → base → boosters → total + coin cash
//
// Source of truth for the real implementations:
// public/.docs/sdd/software_design_component.md (C3).

// -- Coin effects (v1 core set of 11) --
// Face (resolveFace: odds stage → roll → Reverse):
//   weight     75/25 toward its favoured face
//   heads      100/0 — always lands H
//   tails      100/0 — always lands T
//   facedown   hand-visual only (no odds-stage entry; the coin still resolves H/T)
//   chaos      uniform random 0–100% odds on every flip
//   magnetic   75/25 toward the left neighbour's face (no bias if left is empty)
//   reverse    inverts the rolled face (applied after the odds stage)
// Cash (scoreHand step 5, M6):
//   tax      +$1 per coin in the play, deterministic
//   jackpot  +$4 per coin in the play, 25% roll via rng
// Draw / re-flip (store-driven, M4):
//   draw   discarding the coin redraws N face-down (draw1/2/3)
//   echo   one re-flip per coin in the buff phase (echoReflip)

import type { Rng } from './rng'
import { chance } from './rng'
import { isFilled, none, some } from './helpers'
import {
  JACKPOT_CHANCE,
  JACKPOT_FEVER_MULT,
  JACKPOT_PAYOUT,
  MAGNETIC_ODDS,
  PLUS_CHIPS_BONUS,
  PLUS_MULT_BONUS,
  TAX_PAYOUT,
  TIERS,
  WEIGHT_ODDS,
} from './balance'
import type { BossRuleId, CharmId, Coin, CoinEffectKind, Face, Option, Play, Score, TierId } from './types'

const opposite = (f: Face): Face => (f === 'H' ? 'T' : 'H')

/**
 * M7: face resolution — odds stage → roll → Reverse.
 *
 * Odds-stage priority (highest effect present wins):
 *   magnetic (75% toward the left neighbour's face; no bias if left is empty,
 *   in which case the next priority applies) > heads/tails (100/0 fixed face)
 *   > chaos (uniform random 0–100% odds) > weight (75/25 toward its favoured
 *   face) > base (50/50). Face-down is visual-only (no odds-stage entry).
 * Then the face is rolled against the odds, and Reverse inverts it.
 * Echo re-flip (buff phase) = the store calls this again.
 */
export function resolveFace(rng: Rng, coin: Coin, left: Option<Face>): Face {
  const effect = (kind: CoinEffectKind) => coin.effects.find((e) => e.kind === kind)

  // Odds stage — the highest-priority odds effect present sets the odds.
  let target: Face
  let p: number
  const weight = effect('weight')
  if (left.some && effect('magnetic')) {
    target = left.value
    p = MAGNETIC_ODDS
  } else if (effect('heads')) {
    target = 'H'
    p = 1
  } else if (effect('tails')) {
    target = 'T'
    p = 1
  } else if (effect('chaos')) {
    target = 'H'
    p = rng.next() // uniform 0–100% odds, rolled fresh each flip
  } else if (weight && weight.kind === 'weight') {
    target = weight.favored
    p = WEIGHT_ODDS
  } else {
    target = 'H'
    p = 0.5
  }

  // Roll
  let face = rng.next() < p ? target : opposite(target)

  // Reverse inverts the result
  if (effect('reverse')) face = opposite(face)
  return face
}

/**
 * M5: highest-value tier matched by the tossed coins, or `none`.
 *
 * Empty slots count as nothing — the pattern is read on the filled slots' faces
 * only, so a k-coin play can only match tiers that fit in k. Tiers in priority
 * order (high → low): jackpot, fourRow, alternating, fourSame, tripleRun, threeSame.
 *
 * Boss rules apply here:
 *   - noAlternating → an alternating play returns `none` (explicit override, no fall-through)
 *   - noJackpots    → a jackpot play returns `fourSame` (fixed demotion, not a fall-through to fourRow)
 */
export function matchTier(play: Play, boss: Option<BossRuleId>): Option<TierId> {
  const faces = play.filter(isFilled).map((s) => s.face)
  const n = faces.length
  if (n <= 2) return none

  // Count + run stats over the two faces.
  const counts: Record<Face, number> = { H: 0, T: 0 }
  let maxRun = 1
  let run = 1
  for (let i = 0; i < n; i++) {
    counts[faces[i]]++
    run = i > 0 && faces[i] === faces[i - 1] ? run + 1 : 1
    maxRun = Math.max(maxRun, run)
  }
  const maxCount = Math.max(counts.H, counts.T)
  const isAlternating = n === 5 && faces.every((f, i) => i === 0 || f !== faces[i - 1])

  // 1. jackpot — exactly 5 faces, all identical.
  if (n === 5 && maxCount === 5) {
    return boss.some && boss.value === 'noJackpots' ? some('fourSame') : some('jackpot')
  }
  // 2. fourRow — a run of ≥4 adjacent equal faces.
  if (maxRun >= 4) return some('fourRow')
  // 3. alternating — exactly 5 strictly alternating faces.
  if (isAlternating) {
    return boss.some && boss.value === 'noAlternating' ? none : some('alternating')
  }
  // 4. fourSame — some face appears ≥4 times, not necessarily adjacent.
  if (maxCount >= 4) return some('fourSame')
  // 5. tripleRun — a run of ≥3 adjacent equal faces.
  if (maxRun >= 3) return some('tripleRun')
  // 6. threeSame — a face appears exactly 3 times.
  if (maxCount === 3) return some('threeSame')
  return none
}

/**
 * M6: the exact scoring pipeline, in order, no steps merged.
 *   1. Tier     — matchTier(play, boss) (boss tier rules applied inside M5)
 *   2. Base     — {chips, mult} from TIERS; no tier → {0, 0}
 *   3. Boosters — charms left→right: plusChips +10 chips, plusMult +1 mult,
 *                 jackpotFever ×2 chips (jackpot tier only); only these three
 *   4. Score    — total = chips × mult (0 for a no-tier hand)
 *   5. Coin cash — $1 per Tax coin (deterministic) + $4 per Jackpot coin
 *                 passing its 25% roll (rng, never Math.random); paid to cash,
 *                 outside chips × mult
 */
/** M6 steps 1–4 (tier → base → boosters → total) — the deterministic part of
 *  the pipeline (no rng). `scoreHand` adds step 5 (coin cash) on top; the
 *  13a.7 projection reuses this so auto and manual scores agree exactly. */
function tierScore(play: Play, boss: Option<BossRuleId>, charms: CharmId[]): { tier: TierId | null; chips: number; mult: number; total: number } {
  // 1. Tier (boss rules already applied inside matchTier)
  const tierOpt = matchTier(play, boss)
  const tier = tierOpt.some ? tierOpt.value : null

  // 2. Base
  const base = tier ? TIERS.find((t) => t.id === tier) : undefined
  let chips = base?.chips ?? 0
  let mult = base?.mult ?? 0

  // 3. Boosters, left→right, only the three scoring boosters
  for (const charm of charms) {
    if (charm === 'plusChips') chips += PLUS_CHIPS_BONUS
    else if (charm === 'plusMult') mult += PLUS_MULT_BONUS
    else if (charm === 'jackpotFever' && tier === 'jackpot') chips *= JACKPOT_FEVER_MULT
  }

  // 4. Score
  const total = tier ? chips * mult : 0
  return { tier, chips, mult, total }
}

export function scoreHand(play: Play, boss: Option<BossRuleId>, charms: CharmId[], rng: Rng): Score {
  const { tier, chips, mult, total } = tierScore(play, boss, charms)

  // 5. Coin cash (per coin in the play; a merged coin carries both effects)
  let cash = 0
  for (const slot of play) {
    if (!isFilled(slot)) continue
    for (const effect of slot.coin.effects) {
      if (effect.kind === 'tax') cash += TAX_PAYOUT
      else if (effect.kind === 'jackpot' && chance(rng, JACKPOT_CHANCE)) cash += JACKPOT_PAYOUT
    }
  }

  return tier ? { kind: 'scored', tier, chips, mult, total, cash } : { kind: 'none', cash }
}

/**
 * 13a.7 — the projected score: the deterministic pipeline (M6 steps 1–4) over
 *  the first `landed` tossed coins — the pattern that has emerged so far as
 *  the coins land left→right. The play is locked (faces resolved at confirm),
 *  so the projection is deterministic and matches the real score's
 *  chips × mult = total exactly (M13 §0); only the coin cash (step 5 — the
 *  Jackpot 25% roll) is left to the real score, so the projection's cash is 0.
 *  `landed` clamps to the number of filled slots (0..n).
 */
export function projectScore(play: Play, boss: Option<BossRuleId>, charms: CharmId[], landed: number): Score {
  const filled = play.filter(isFilled)
  const n = Math.max(0, Math.min(landed, filled.length))
  const { tier, chips, mult, total } = tierScore(filled.slice(0, n), boss, charms)
  return tier ? { kind: 'scored', tier, chips, mult, total, cash: 0 } : { kind: 'none', cash: 0 }
}
