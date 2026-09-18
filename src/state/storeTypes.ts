// Store plumbing types shared by the action modules (handActions, shopActions,
// saveActions) and the store wiring (runStore).

import type { WritableDraft } from 'immer'
import type { RunState, ShopOffer } from '@/core/types'

/** The immer draft of the run state (what `set` mutators receive). */
export type Draft = WritableDraft<RunState>
/** The store's `set` (immer mutator form). */
export type SetFn = (mutate: (st: Draft) => void) => void
/** The store's `get`. */
export type GetFn = () => RunState

/** The store's actions (the wiring in runStore implements this). */
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
  /** shop: forge two coins — the special rules (core/forge) decide the result; fromId removed; costs FORGE_COST. */
  mergeCoin: (fromId: number, toId: number) => void
  /** shop: Recycler — sell a coin for its recycle price ($1 per effect, $1 minimum); the coin is removed. */
  sellCoin: (id: number) => void
  /** run/shop: reorder the charms — array order is the charm-bar (scoring) order. */
  moveCharm: (from: number, to: number) => void
  /** shop: 13a.15 unlimited reroll — costs $1 more than the previous reroll this round; regenerate all offers (rng). */
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
