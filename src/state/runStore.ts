// C4 — Run store: the 5-phase hand state machine (M4).
//
// Per-hand flow (SDD C4 + Run State Machine; Q&A 2026-09-14, round 3):
//   draw → play → toss → buff → score → (draw | endBlind)
// - draw:  drawHand() — pop up to handSize face-down coins (auto)
// - play:  pickCoin / unpickCoin / discard — play 1–5, unlimited discard
// - toss:  confirmPlay() — resolveFace per picked coin in play order (transient)
// - buff:  echoReflip() — one re-flip per Echo coin (boosters apply at score)
// - score: score() — C3 pipeline → blindScore/cash; ALL coins to discard; handsLeft −1
//
// An action fired in the wrong handPhase is a no-op.
//
// The RNG lives in a closure (not serializable); `rngState` mirrors it for
// save/resume (M11). C3: matchTier (M5) + scoreHand (M6) are real; resolveFace is a stub until M7.

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { WritableDraft } from 'immer'
import { BLINDS, HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE, START_CASH } from '@/core/balance'
import {
  buildCollection,
  discardToPile,
  drawFromDeck,
  returnHandToPile,
  shuffleCollection,
} from '@/core/deck'
import { emptyHand, filledSlot, isFilled, none, scoreTotal, some } from '@/core/helpers'
import { createRng, generateSeed } from '@/core/rng'
import { resolveFace, scoreHand } from '@/core/scoring'
import type { BossRuleId, Face, Option, RunState } from '@/core/types'

/** Placeholder face for face-down coins (hand and pre-toss play slots).
 *  Meaningless until the toss phase resolves the face (SDD C4). */
const FACE_DOWN: Face = 'H'

export interface RunActions {
  /** New run: seed (or generated); fresh rng + shuffled collection; phase 'run', handPhase 'draw'. */
  startRun: (seed?: string) => void
  /** draw → play: pop up to handSize face-down coins into the hand (fewer if the pile is short). */
  drawHand: () => void
  /** play: move a hand coin into the next free play slot (no-op when the play is full). */
  pickCoin: (handIndex: number) => void
  /** play: return a play coin to the first empty hand slot. */
  unpickCoin: (slotIndex: number) => void
  /** play (unlimited): hand coin → discard pile (gone for the blind); draw-enchant coins redraw N face-down. */
  discard: (handIndex: number) => void
  /** play → toss → buff: resolveFace per picked coin in play order (requires ≥1 picked). */
  confirmPlay: () => void
  /** buff: re-run face resolution once for an unused Echo coin in the play. */
  echoReflip: (slotIndex: number) => void
  /** buff → score → draw: C3 pipeline → blindScore/cash; ALL coins to discard; handsLeft −1 (endBlind at 0). */
  score: () => void
  /** UI convenience (C9 Menu button): back to the menu. */
  toMenu: () => void
}

export type RunStore = RunState & RunActions

/** Blind end (M4 minimal: target check + phase transition). M10 adds rewards,
 *  boss rules, and round progression. Called by score() when handsLeft hits 0. */
function endBlind(st: WritableDraft<RunState>) {
  const blind = BLINDS[st.blindIndex]
  if (st.blindScore >= blind.target) {
    if (st.blindIndex >= BLINDS.length - 1) {
      st.phase = 'runEnd'
      st.won = true
    } else {
      st.phase = 'shop' // M9: draw shop offers from the rng
    }
  } else {
    st.phase = 'runEnd'
    st.won = false
  }
}

export function createRunStore() {
  let rng = createRng('')
  return create<RunStore>()(
    immer((set, get) => ({
      // -- initial state: menu, no run in progress --
      seed: '',
      phase: 'menu',
      round: 1,
      blindIndex: 0,
      hand: emptyHand(HAND_SIZE),
      play: emptyHand(PLAY_SIZE),
      handPhase: 'draw',
      handSize: HAND_SIZE,
      handsLeft: HANDS_PER_BLIND,
      blindScore: 0,
      cash: 0,
      charms: [],
      deck: { drawPile: [], discardPile: [] },
      shop: { offers: [], rerollUsed: false },
      lastScore: none,
      runScore: 0,
      won: false,
      rngState: [],

      startRun: (seedArg) => {
        const seed = seedArg ?? generateSeed()
        rng = createRng(seed)
        set((st) => {
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
          st.charms = []
          st.deck = shuffleCollection(rng, buildCollection())
          st.shop = { offers: [], rerollUsed: false }
          st.lastScore = none
          st.runScore = 0
          st.won = false
          st.rngState = rng.state()
        })
      },

      drawHand: () =>
        set((st) => {
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
            if (st.handsLeft <= 0) endBlind(st)
            return
          }
          st.handPhase = 'play'
        }),

      pickCoin: (handIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'play') return
          const slot = st.hand[handIndex]
          if (!slot || slot.kind !== 'filled') return
          const target = st.play.findIndex((p) => p.kind === 'empty')
          if (target === -1) return // play full (5) — no-op
          st.play[target] = slot
          st.hand[handIndex] = { kind: 'empty' }
        }),

      unpickCoin: (slotIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'play') return
          const slot = st.play[slotIndex]
          if (!slot || slot.kind !== 'filled') return
          const target = st.hand.findIndex((h) => h.kind === 'empty')
          if (target === -1) return // hand full — no-op
          st.hand[target] = slot
          st.play[slotIndex] = { kind: 'empty' }
        }),

      discard: (handIndex) =>
        set((st) => {
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
        }),

      confirmPlay: () => {
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
      },

      echoReflip: (slotIndex) =>
        set((st) => {
          if (st.phase !== 'run' || st.handPhase !== 'buff') return
          const slot = st.play[slotIndex]
          if (!slot || slot.kind !== 'filled' || slot.echoUsed) return
          if (!slot.coin.effects.some((e) => e.kind === 'echo')) return
          const prev = slotIndex > 0 ? st.play[slotIndex - 1] : undefined
          const left: Option<Face> = prev && prev.kind === 'filled' ? some(prev.face) : none
          slot.face = resolveFace(rng, slot.coin, left)
          slot.echoUsed = true
          st.rngState = rng.state()
        }),

      score: () => {
        const st = get()
        if (st.phase !== 'run' || st.handPhase !== 'buff') return
        // Step 1: buff → score (observable — the UI runs the chips×mult ticker here).
        set((s) => {
          s.handPhase = 'score'
        })
        // Step 2: score → draw — C3 pipeline, then all coins to the discard pile.
        set((s) => {
          const blind = BLINDS[s.blindIndex]
          const boss: Option<BossRuleId> = blind.kind === 'boss' ? some(blind.rule) : none
          const result = scoreHand(s.play, boss, s.charms, rng)
          // ALL hand coins (tossed + unpicked) → discard pile (gone for the blind).
          s.deck = returnHandToPile(s.deck, s.hand)
          s.play.forEach((slot) => {
            if (slot.kind === 'filled') s.deck = discardToPile(s.deck, slot.coin)
          })
          s.blindScore += scoreTotal(result)
          s.cash += result.cash
          s.handsLeft -= 1
          s.lastScore = some(result)
          s.hand = emptyHand(s.handSize)
          s.play = emptyHand(PLAY_SIZE)
          s.rngState = rng.state()
          s.handPhase = 'draw'
          if (s.handsLeft <= 0) endBlind(s)
        })
      },

      toMenu: () =>
        set((st) => {
          st.phase = 'menu'
        }),
    })),
  )
}

/** The app-wide store instance. */
export const useRunStore = createRunStore()
