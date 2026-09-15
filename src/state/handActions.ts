// C4 — Hand-flow actions: the 5-phase hand state machine (M4).
//
// Per-hand flow (SDD C4 + Run State Machine; Q&A 2026-09-14, round 3):
//   draw → play → toss → buff → score → (draw | endBlind)
// - draw:  drawHand() — pop up to handSize face-down coins (auto)
// - play:  pickCoin / unpickCoin / discard — play 1–5, unlimited discard
// - toss:  confirmPlay() — resolveFace per picked coin in play order (transient)
// - buff:  echoReflip() — one re-flip per Echo coin (boosters apply at score)
// - score: score() — C3 pipeline → blindScore/cash; ONLY the played coins
//   go to the discard pile — unplayed hand coins stay in the hand and the
//   next hand refills around them (13a.2 keep-unplayed); handsLeft −1
//
// An action fired in the wrong handPhase is a no-op.
//
// The RNG lives in the store's closure (not serializable); `rngState` mirrors
// it for save/resume (M11). C3: resolveFace (M7), matchTier (M5) + scoreHand
// (M6) are all real. Action bodies are module-level functions (≤60 lines,
// NASA practice); the store wires them up.

import {
  BLINDS,
  EARLY_CLEAR_BONUS_PER_HAND,
  HANDS_PER_BLIND,
  HAND_SIZE,
  HEAVY_TARGET_BONUS,
  HEAVY_TARGET_MULT,
  PAYDAY_BONUS,
  PLAY_SIZE,
  START_CASH,
} from '@/core/balance'
import {
  buildCollection,
  discardToPile,
  drawFromDeck,
  shuffleCollection,
} from '@/core/deck'
import { emptyHand, filledSlot, isFilled, none, scoreTotal, some } from '@/core/helpers'
import { createRng, generateSeed } from '@/core/rng'
import type { Rng } from '@/core/rng'
import { resolveFace, scoreHand } from '@/core/scoring'
import type { BossRuleId, Face, Option } from '@/core/types'
import type { Draft, GetFn, SetFn } from './storeTypes'
import { generateOffers } from './shopActions'

/** Placeholder face for face-down coins (hand and pre-toss play slots).
 *  Meaningless until the toss phase resolves the face (SDD C4). */
const FACE_DOWN: Face = 'H'

// -- startRun ------------------------------------------------------------------

function startRunDraft(st: Draft, rng: Rng, seed: string): void {
  st.seed = seed
  st.phase = 'run'
  st.round = 1
  st.blindIndex = 0
  st.hand = emptyHand(HAND_SIZE)
  st.play = emptyHand(PLAY_SIZE)
  st.handPhase = 'draw'
  st.handSize = HAND_SIZE
  st.handsLeft = HANDS_PER_BLIND
  st.blindScore = 0
  st.cash = START_CASH
  st.earlyClearBonus = 0
  st.charms = []
  st.deck = shuffleCollection(rng, buildCollection())
  st.shop = { offers: [], rerollUsed: false }
  st.lastScore = none
  st.runScore = 0
  st.won = false
  st.rngState = rng.state()
}

/** New run: seed (or generated); returns the fresh rng (the store stores it). */
export function startRun(set: SetFn, seedArg?: string): Rng {
  const seed = seedArg ?? generateSeed()
  const next = createRng(seed)
  set((st) => startRunDraft(st, next, seed))
  return next
}

// -- draw / play ----------------------------------------------------------------

export function drawHandDraft(st: Draft, rng: Rng): void {
  if (st.phase !== 'run' || st.handPhase !== 'draw') return
  for (let i = 0; i < st.hand.length; i++) {
    if (st.hand[i].kind !== 'empty') continue
    const d = drawFromDeck(st.deck)
    if (!d.some) break
    st.hand[i] = filledSlot(d.value, FACE_DOWN)
    st.deck.drawPile = st.deck.drawPile.slice(1)
  }
  if (!st.hand.some(isFilled)) {
    // Empty pile at hand start: auto-skip the hand (no score), handsLeft −1,
    // back to draw (design decision 2026-09-14 — the SDD was silent here).
    st.handsLeft -= 1
    if (st.handsLeft <= 0) endBlind(st, rng)
    return
  }
  st.handPhase = 'play'
}

export function pickCoinDraft(st: Draft, handIndex: number): void {
  if (st.phase !== 'run' || st.handPhase !== 'play') return
  const slot = st.hand[handIndex]
  if (!slot || slot.kind !== 'filled') return
  const target = st.play.findIndex((p) => p.kind === 'empty')
  if (target === -1) return // play full (5) — no-op
  st.play[target] = slot
  st.hand[handIndex] = { kind: 'empty' }
}

export function unpickCoinDraft(st: Draft, slotIndex: number): void {
  if (st.phase !== 'run' || st.handPhase !== 'play') return
  const slot = st.play[slotIndex]
  if (!slot || slot.kind !== 'filled') return
  const target = st.hand.findIndex((h) => h.kind === 'empty')
  if (target === -1) return // hand full — no-op
  st.hand[target] = slot
  st.play[slotIndex] = { kind: 'empty' }
}

export function discardDraft(st: Draft, handIndex: number): void {
  if (st.phase !== 'run' || st.handPhase !== 'play') return
  const slot = st.hand[handIndex]
  if (!slot || slot.kind !== 'filled') return
  const coin = slot.coin
  st.hand[handIndex] = { kind: 'empty' }
  st.deck = discardToPile(st.deck, coin)
  // Draw-enchant coin: redraw N face-down into empty hand slots (discarded slot first).
  const draw = coin.effects.find((e) => e.kind === 'draw')
  if (draw && draw.kind === 'draw') {
    const order = [
      handIndex,
      ...st.hand.map((_, i) => i).filter((i) => i !== handIndex && st.hand[i].kind === 'empty'),
    ]
    let n = draw.count
    for (const i of order) {
      if (n <= 0) break
      const d = drawFromDeck(st.deck)
      if (!d.some) break
      st.hand[i] = filledSlot(d.value, FACE_DOWN)
      st.deck.drawPile = st.deck.drawPile.slice(1)
      n--
    }
  }
}

// -- toss / buff -----------------------------------------------------------------

export function confirmPlay(get: GetFn, set: SetFn, rng: Rng): void {
  const st = get()
  if (st.phase !== 'run' || st.handPhase !== 'play') return
  if (!st.play.some(isFilled)) return // requires ≥1 coin in the play
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
  const result = scoreHand(st.play, boss, st.charms, rng)
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
  st.handPhase = 'draw'
  // 13a.4: the moment the target is met, end the blind — don't force the
  // player through the remaining hands (unused hands pay a bonus in endBlind).
  if (st.handsLeft <= 0 || st.blindScore >= effectiveTarget(blind)) endBlind(st, rng)
}

/** The blind's runtime target (Heavy Target boss: ×1.5 — 1750 → 2625, m13a). */
function effectiveTarget(blind: (typeof BLINDS)[number]): number {
  return blind.kind === 'boss' && blind.rule === 'heavyTarget' ? blind.target * HEAVY_TARGET_MULT : blind.target
}

export function score(get: GetFn, set: SetFn, rng: Rng): void {
  const st = get()
  if (st.phase !== 'run' || st.handPhase !== 'buff') return
  // Step 1: buff → score (observable — the UI runs the chips×mult ticker here).
  set((s) => {
    s.handPhase = 'score'
  })
  // Step 2: score → draw — C3 pipeline, then all coins to the discard pile.
  set((s) => scoreDraft(s, rng))
}

/** Blind end (M4 minimal: target check + phase transition). M10 adds rewards,
 *  boss rules, and round progression. Called by score() when handsLeft hits 0. */
function endBlind(st: Draft, rng: Rng): void {
  const blind = BLINDS[st.blindIndex]
  const isHeavy = blind.kind === 'boss' && blind.rule === 'heavyTarget'
  if (st.blindScore >= effectiveTarget(blind)) {
    // 13a.4: unused hands convert to money (+$1 each, deterministic).
    st.earlyClearBonus = st.handsLeft * EARLY_CLEAR_BONUS_PER_HAND
    // Reward: base + Payday charm + Heavy Target bonus + early-clear bonus.
    st.cash +=
      blind.reward +
      (st.charms.includes('payday') ? PAYDAY_BONUS : 0) +
      (isHeavy ? HEAVY_TARGET_BONUS : 0) +
      st.earlyClearBonus
    if (st.blindIndex >= BLINDS.length - 1) {
      st.phase = 'runEnd'
      st.won = true
    } else {
      st.phase = 'shop'
      st.shop = {
        offers: generateOffers(rng, st.charms, st.handSize),
        rerollUsed: false,
      }
    }
  } else {
    st.phase = 'runEnd'
    st.won = false
  }
}
