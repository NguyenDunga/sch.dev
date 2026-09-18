// C4 — Run store: the app-wide zustand store for a 50/50 run.
//
// The hand state machine (draw → play → toss → buff → score), the shop, and
// save/resume live in the action modules:
//   - hand-draw.ts    — startRun / drawHand / pickCoin / unpickCoin / discard
//   - hand-score.ts   — confirmPlay / echoReflip / score / finishScore (+ blind end)
//   - shop-offers.ts  — shop entry + offer generation
//   - shopActions.ts  — buy / reroll / mergeCoin / sellCoin / moveCharm / leaveShop
//   - saveActions.ts  — save / resume
//
// This file owns the initial state and the wiring. The action interface
// (RunActions) + store plumbing types live in storeTypes.ts. The RNG lives
// in a closure (not serializable); `rngState` mirrors it for save/resume (M11).

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import { emptyHand, none } from '@/core/helpers'
import { createRng } from '@/core/rng'
import type { Rng } from '@/core/rng'
import type { RunState } from '@/core/types'
import type { RunActions } from './storeTypes'
import {
  discardDraft,
  drawHandDraft,
  movePlayCoinDraft,
  pickCoinDraft,
  startRun,
  unpickCoinDraft,
} from './hand'
import { confirmPlay, echoReflipDraft, finishScore, score } from './hand'
import {
  buyDraft,
  leaveShopDraft,
  mergeCoinDraft,
  moveCharmDraft,
  rerollDraft,
  sellCoinDraft,
} from './shop'
import { hasSave, resume, save } from './saveActions'

// The action interface lives in storeTypes.ts (150-LOC file rule).
export type { RunActions } from './storeTypes'

export type RunStore = RunState & RunActions

function initialState(): RunState {
  return {
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
    earlyClearBonus: 0,
    charms: [],
    deck: { drawPile: [], discardPile: [] },
    shop: { offers: [] },
    rerollCount: 0,
    lastScore: none,
    runScore: 0,
    won: false,
    rngState: [],
  }
}

export function createRunStore() {
  let rng: Rng = createRng('')
  return create<RunStore>()(
    immer((set, get) => ({
      ...initialState(),
      startRun: (seedArg) => {
        rng = startRun(set, seedArg)
      },
      drawHand: () => set((st) => drawHandDraft(st, rng)),
      pickCoin: (handIndex) => set((st) => pickCoinDraft(st, handIndex)),
      unpickCoin: (slotIndex) => set((st) => unpickCoinDraft(st, slotIndex)),
      movePlayCoin: (from, to) => set((st) => movePlayCoinDraft(st, from, to)),
      discard: (handIndex) => set((st) => discardDraft(st, handIndex, rng)),
      confirmPlay: () => confirmPlay(get, set, rng),
      echoReflip: (slotIndex) => set((st) => echoReflipDraft(st, slotIndex, rng)),
      score: () => score(get, set, rng),
      finishScore: () => finishScore(get, set, rng),
      mergeCoin: (fromId, toId) => set((st) => mergeCoinDraft(st, fromId, toId)),
      sellCoin: (id) => set((st) => sellCoinDraft(st, id)),
      moveCharm: (from, to) => set((st) => moveCharmDraft(st, from, to)),
      reroll: () => set((st) => rerollDraft(st, rng)),
      buy: (offer) => set((st) => buyDraft(st, offer, rng)),
      leaveShop: () => set((st) => leaveShopDraft(st, rng)),
      save: () => save(get),
      hasSave: () => hasSave(),
      resume: () => resume(set, rng),
      toMenu: () => set((st) => {
        st.phase = 'menu'
      }),
    })),
  )
}

/** The app-wide store instance. */
export const useRunStore = createRunStore()
