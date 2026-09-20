// C4 — Hand flow, toss/buff/score phases + blind end (M4).
//
// Per-hand flow (SDD C4 + Run State Machine; Q&A 2026-09-14, round 3):
//   draw → play → toss → buff → score → (draw | endBlind)
// - toss:  confirmPlay() — resolveFace per picked coin in play order (transient)
// - buff:  echoReflip() — one re-flip per Echo coin (boosters apply at score)
// - score: score() — C3 pipeline → blindScore/cash; ONLY the played coins
//   go to the discard pile — unplayed hand coins stay in the hand and the
//   next hand refills around them (13a.2 keep-unplayed); handsLeft −1. The
//   hand STAYS in 'score' while the UI plays the scoring choreography over
//   lastScore; finishScore() then advances to draw (or ends the blind) once
//   the animation + ticker are done (async hand flow).
//
// An action fired in the wrong handPhase is a no-op. The draw/play phases
// live in hand-draw.ts. Action bodies are module-level functions (≤60
// lines, NASA practice); the store wires them up.

import {
  BLINDS,
  EARLY_CLEAR_BONUS_PER_HAND,
  HEAVY_TARGET_BONUS,
  HEAVY_TARGET_MULT,
  PLAY_SIZE,
} from '@/core/balance'
import { CHARMS } from '@/config/charms'
import { discardToPile } from '@/core/collection'
import { emptyHand, none, scoreTotal, some } from '@/core/helpers'
import type { Rng } from '@/core/rng'
import { resolveFace, scoreHand } from '@/core/scoring'
import type { BossRuleId, Face, Option } from '@/core/types'
import type { Draft, GetFn, SetFn } from '../storeTypes'
import { enterShopDraft } from '../shop'

// -- toss / buff -----------------------------------------------------------------

export function confirmPlay(get: GetFn, set: SetFn, rng: Rng): void {
  const st = get()
  if (st.phase !== 'run' || st.handPhase !== 'play') return
  if (!st.play.some((s) => s.kind === 'filled')) return // requires ≥1 coin in the play
  // Step 1: play → toss (observable — the UI plays the toss animation here).
  set((s) => {
    s.handPhase = 'toss'
  })
  // Step 2: toss → buff — resolve each picked coin's face in play order
  // (left → right); the left neighbour's face is already resolved (SDD C4).
  set((s) => {
    s.play.forEach((slot, i) => {
      if (slot.kind !== 'filled') return
      const prev = i > 0 ? s.play[i - 1] : undefined
      const left: Option<Face> = prev && prev.kind === 'filled' ? some(prev.face) : none
      slot.face = resolveFace(rng, slot.coin, left)
    })
    s.handPhase = 'buff'
    s.rngState = rng.state()
  })
}

export function echoReflipDraft(st: Draft, slotIndex: number, rng: Rng): void {
  if (st.phase !== 'run' || st.handPhase !== 'buff') return
  const slot = st.play[slotIndex]
  if (!slot || slot.kind !== 'filled' || slot.echoUsed) return
  if (!slot.coin.effects.some((e) => e.kind === 'echo')) return
  const prev = slotIndex > 0 ? st.play[slotIndex - 1] : undefined
  const left: Option<Face> = prev && prev.kind === 'filled' ? some(prev.face) : none
  slot.face = resolveFace(rng, slot.coin, left)
  slot.echoUsed = true
  st.rngState = rng.state()
}

// -- score / blind end -------------------------------------------------------------

function scoreDraft(st: Draft, rng: Rng): void {
  const blind = BLINDS[st.blindIndex]
  const boss: Option<BossRuleId> = blind.kind === 'boss' ? some(blind.rule) : none
  const result = scoreHand(st.play, boss, st.charms, rng, st.tierUpgrades)
  // 13a.2 keep-unplayed: only the PLAYED coins go to the discard pile (gone
  // for the rest of the blind); unplayed hand coins stay in the hand and the
  // next hand refills to handSize around them (drawHand fills empty slots).
  st.play.forEach((slot) => {
    if (slot.kind === 'filled') st.deck = discardToPile(st.deck, slot.coin)
  })
  st.blindScore += scoreTotal(result)
  st.runScore += scoreTotal(result)
  st.cash += result.cash
  st.handsLeft -= 1
  st.lastScore = some(result)
  st.play = emptyHand(PLAY_SIZE)
  st.rngState = rng.state()
  // STAY in 'score': the UI plays the scoring choreography over lastScore
  // (the chips×mult ticker). The hand does not advance here — finishScore()
  // moves it to 'draw' (or ends the blind) once the choreography settles.
  st.handPhase = 'score'
}

/** The blind's runtime target (Heavy Target boss: ×1.5 — 1750 → 2625, m13a). */
function effectiveTarget(blind: (typeof BLINDS)[number]): number {
  return blind.kind === 'boss' && blind.rule === 'heavyTarget' ? blind.target * HEAVY_TARGET_MULT : blind.target
}

export function score(get: GetFn, set: SetFn, rng: Rng): void {
  const st = get()
  if (st.phase !== 'run' || st.handPhase !== 'buff') return
  // buff → score: run the C3 pipeline, update the totals, empty the play, and
  // set lastScore — but STAY in 'score'. The UI plays the scoring choreography
  // over lastScore; the hand only advances when it settles (finishScore).
  set((s) => scoreDraft(s, rng))
}

/** score → draw (or endBlind): the scoring choreography has settled (beat 7).
 *  Called by the UI once the score ticker/animation is done, so a new hand is
 *  only dealt (and the next round started) after the calculation animation and
 *  ticker are finished. The blind ends when the hands are gone or the target
 *  is met (13a.4) — that transition is also deferred until the choreography
 *  settles, so the full score animation plays before the shop / run end. */
export function finishScore(get: GetFn, set: SetFn, rng: Rng): void {
  const st = get()
  if (st.phase !== 'run' || st.handPhase !== 'score') return
  set((s) => {
    const blind = BLINDS[s.blindIndex]
    if (s.handsLeft <= 0 || s.blindScore >= effectiveTarget(blind)) endBlind(s, rng)
    else s.handPhase = 'draw'
  })
}

/** Blind end (M4 minimal: target check + phase transition). M10 adds rewards,
 *  boss rules, and round progression. Called by finishScore() when the hands
 *  are gone or the target is met, and by hand-draw on an empty pile. */
export function endBlind(st: Draft, rng: Rng): void {
  const blind = BLINDS[st.blindIndex]
  const isHeavy = blind.kind === 'boss' && blind.rule === 'heavyTarget'
  if (st.blindScore >= effectiveTarget(blind)) {
    // 13a.4: unused hands convert to money (+$1 each, deterministic).
    st.earlyClearBonus = st.handsLeft * EARLY_CLEAR_BONUS_PER_HAND
    // Reward: base + Payday charm + Heavy Target bonus + early-clear bonus.
    st.cash +=
      blind.reward +
      (st.charms.includes('payday') ? (CHARMS.payday.params.bonus ?? 0) : 0) +
      (isHeavy ? HEAVY_TARGET_BONUS : 0) +
      st.earlyClearBonus
    if (st.blindIndex >= BLINDS.length - 1) {
      st.phase = 'runEnd'
      st.won = true
    } else {
      enterShopDraft(st, rng) // the shop entry lives in shop-offers (M10.2)
    }
  } else {
    st.phase = 'runEnd'
    st.won = false
  }
}
