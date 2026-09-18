// C4 — Run store: the app-wide zustand store for a 50/50 run.
//
// The hand state machine (draw → play → toss → buff → score), the shop, and
// save/resume live in the action modules:
//   - handActions.ts  — startRun / drawHand / pickCoin / unpickCoin / discard /
//     confirmPlay / echoReflip / score (+ blind end)
//   - shopActions.ts  — buy / reroll / mergeCoin / removeCoin / moveCharm /
//     leaveShop (+ offer generation)
//   - saveActions.ts  — save / resume
//
// This file owns the state shape (RunState & RunActions), the initial state,
// and the wiring. The RNG lives in a closure (not serializable); `rngState`
// mirrors it for save/resume (M11).

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import { emptyHand, none } from '@/core/helpers'
import { createRng } from '@/core/rng'
import type { Rng } from '@/core/rng'
import type { RunState, ShopOffer } from '@/core/types'
import {
  confirmPlay,
  discardDraft,
  drawHandDraft,
  echoReflipDraft,
  finishScore,
  pickCoinDraft,
  score,
  startRun,
  unpickCoinDraft,
  movePlayCoinDraft,
} from './handActions'
import {
  buyDraft,
  leaveShopDraft,
  mergeCoinDraft,
  moveCharmDraft,
  removeCoinDraft,
  rerollDraft,
} from './shopActions'
import { hasSave, resume, save } from './saveActions'

export interface RunActions {
  /** New run: seed (or generated); fresh rng + shuffled collection; phase 'run', handPhase 'draw'. */
  startRun: (seed?: string) => void
  /** draw → play: pop up to handSize face-down coins into the hand (fewer if the pile is short). */
  drawHand: () => void
  /** play: move a hand coin into the next free play slot (no-op when the play is full). */
  pickCoin: (handIndex: number) => void
  /** play: return a play coin to the first empty hand slot. */
  unpickCoin: (slotIndex: number) => void
  /** 13a.5 play: reorder the play row (move onto empty, swap onto filled). */
  movePlayCoin: (from: number, to: number) => void
  /** play (unlimited): hand coin → discard pile (gone for the blind); draw-enchant coins redraw N face-down. */
  discard: (handIndex: number) => void
  /** play → toss → buff: resolveFace per picked coin in play order (requires ≥1 picked). */
  confirmPlay: () => void
  /** buff: re-run face resolution once for an unused Echo coin in the play. */
  echoReflip: (slotIndex: number) => void
  /** buff → score: C3 pipeline → blindScore/cash; ALL played coins to discard;
   *  handsLeft −1; lastScore set. The hand STAYS in 'score' — the UI plays the
   *  scoring choreography over lastScore, then calls finishScore() to advance. */
  score: () => void
  /** score → draw (or endBlind): advance the hand once the scoring choreography
   *  has settled (the UI calls this when the ticker/animation are done). */
  finishScore: () => void
  /** shop: toId gains all of fromId's effects (stack freely, no cap); fromId removed from the collection; free. */
  mergeCoin: (fromId: number, toId: number) => void
  /** shop: remove a coin from the collection; cash -= REMOVE_COIN_COST ($1). Delete only — never a refund. */
  removeCoin: (id: number) => void
  /** run/shop: reorder the charms — array order is the charm-bar (scoring) order. */
  moveCharm: (from: number, to: number) => void
  /** shop: if the free reroll is unused, regenerate all offers (rng); rerollUsed = true. */
  reroll: () => void
  /** run/shop: manual save — serialize { version: 3, state } to localStorage (explicit only, no autosave). */
  save: () => void
  /** C5: a resumable save exists (the menu shows Resume only then). */
  hasSave: () => boolean
  /** Restore the saved run; no-op when absent / unparseable / not version 2. */
  resume: () => void
  /**
   * shop → run: next blind — blindIndex +1; reset handsLeft (10; SHORT_FUSE_HANDS on
   * the Short Fuse boss; +1 with Extra Hand), blindScore, hand/play; reshuffle the
   * whole collection into the draw pile (rng), discard cleared.
   */
  leaveShop: () => void
  /**
   * shop: buy an offer — cash -= price; charm → charms (M9.3), coin → collection
   * with rolled favoured face (M9.4), handSize → handSize + 1 (M9.7); the offer
   * is removed. Reject (state unchanged) if broke or the charm is already owned.
   */
  buy: (offer: ShopOffer) => void
  /** UI convenience (C9 Menu button): back to the menu. */
  toMenu: () => void
}

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
    shop: { offers: [], rerollUsed: false },
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
      discard: (handIndex) => set((st) => discardDraft(st, handIndex)),
      confirmPlay: () => confirmPlay(get, set, rng),
      echoReflip: (slotIndex) => set((st) => echoReflipDraft(st, slotIndex, rng)),
      score: () => score(get, set, rng),
      finishScore: () => finishScore(get, set, rng),
      mergeCoin: (fromId, toId) => set((st) => mergeCoinDraft(st, fromId, toId)),
      removeCoin: (id) => set((st) => removeCoinDraft(st, id)),
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
