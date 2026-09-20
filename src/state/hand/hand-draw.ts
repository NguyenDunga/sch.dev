// C4 — Hand flow, draw/play phases (M4): startRun / draw / pick / unpick /
// move / discard. Per-hand flow: draw → play → toss → buff → score →
// (draw | endBlind). The toss/buff/score phases + the blind end live in
// hand-score.ts. An action fired in the wrong handPhase is a no-op. The RNG
// lives in the store's closure (not serializable); `rngState` mirrors it for
// save/resume (M11). Action bodies are module-level functions (≤60 lines);
// the store wires them up.

import { HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE, START_CASH, zeroTierUpgrades } from '@/core/balance'
import { buildCollection, discardToPile, drawFromDeck, shuffleCollection } from '@/core/collection'
import { emptyHand, filledSlot, isFilled, none } from '@/core/helpers'
import { createRng, generateSeed, type Rng } from '@/core/rng'
import type { Draft, SetFn } from '../storeTypes'
import { endBlind } from './hand-score'

/** Placeholder face for face-down coins (meaningless until the toss resolves the face). */
const FACE_DOWN = 'H' as const

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
  st.rerollCount = 0
  st.charms = []
  st.tierUpgrades = zeroTierUpgrades()
  st.deck = shuffleCollection(rng, buildCollection(rng))
  st.shop = { offers: [] }
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
    if (st.deck.drawPile.length === 0) {
      // Hand empty AND draw pile empty: nothing left to draw and nothing
      // left to play — no further hand can ever be dealt. End the blind now
      // (win if the target is met, lose otherwise) instead of looping the
      // draw phase forever.
      st.handsLeft -= 1
      endBlind(st, rng)
      return
    }
    // Empty hand but the pile still has coins: auto-skip the hand (no
    // score), handsLeft −1, back to draw (design decision 2026-09-14 — the
    // SDD was silent here).
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

/** 13a.5: reorder the play row (drag a face-down play coin onto another
 *  slot). Move onto an empty slot, swap onto a filled one. Only in the play
 *  phase — the toss plays the row in its final order (order-dependent tiers:
 *  tripleRun / alternating / fourRow). */
export function movePlayCoinDraft(st: Draft, from: number, to: number): void {
  if (st.phase !== 'run' || st.handPhase !== 'play') return
  if (from === to || from < 0 || to < 0 || from >= PLAY_SIZE || to >= PLAY_SIZE) return
  const a = st.play[from]
  if (!a || a.kind !== 'filled') return
  const b = st.play[to]
  st.play[to] = a
  st.play[from] = b
}

export function discardDraft(st: Draft, handIndex: number, rng: Rng): void {
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
  // Dead hand (player report): the discard left NO coin in the hand AND the
  // play row — nothing can ever be picked or confirmed. End the blind now
  // (win if the target is met, lose otherwise) instead of stranding the play phase.
  if (!st.hand.some(isFilled) && !st.play.some(isFilled)) {
    st.handsLeft -= 1
    endBlind(st, rng)
  }
}
