// C3 — Scoring pipeline (STUB until M5/M6 land).
//
// M4 ships the hand-phase state machine (C4) and calls C3 through its final
// signatures, so the store never changes when the real pipeline lands. The
// stubs below are minimal but correct for plain coins:
//   - resolveFace: fair 50/50 roll (M7 adds the effect odds stage)
//   - matchTier:   no tier matched (M5)
//   - scoreHand:   no tier, no coin cash (M6)
//
// Source of truth for the real implementations:
// public/.docs/sdd/software_design_component.md (C3).

import type { Rng } from './rng'
import { none } from './helpers'
import type { BossRuleId, CharmId, Coin, Face, Option, Play, Score, TierId } from './types'

/** STUB (M7): fair 50/50 roll. Real: odds stage (Magnetic > Double-Side > Chaos > Weight > base) → roll → Reverse. */
export function resolveFace(rng: Rng, coin: Coin, left: Option<Face>): Face {
  void coin
  void left
  return rng.next() < 0.5 ? 'H' : 'T'
}

/** STUB (M5): no tier matched. Real: highest-value tier on the tossed coins (empty slots count as nothing). */
export function matchTier(play: Play, boss: Option<BossRuleId>): Option<TierId> {
  void play
  void boss
  return none
}

/** STUB (M6): no tier, no coin cash. Real: tier → base → boosters → total + coin cash (Tax/Jackpot). */
export function scoreHand(play: Play, boss: Option<BossRuleId>, charms: CharmId[], rng: Rng): Score {
  void play
  void boss
  void charms
  void rng
  return { kind: 'none', cash: 0 }
}
