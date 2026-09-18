// C9 — Save / resume actions (M11).
//
// Save is explicit only (no autosave): { version: 3, state } to localStorage
// in the run/shop phases. Resume is a no-op when the save is absent,
// unparseable, not version 3, or not resumable. Action bodies are module-level
// functions (≤60 lines, NASA practice); the store wires them up.

import { BLINDS, HANDS_PER_BLIND, PLAY_SIZE, SHORT_FUSE_HANDS } from '@/core/balance'
import { shuffleCollection } from '@/core/deck'
import { emptyHand, none, some } from '@/core/helpers'
import type { Rng } from '@/core/rng'
import type { Option, RunState } from '@/core/types'
import type { GetFn, SetFn } from './storeTypes'
import { generateOffers } from './shopActions'

const SAVE_KEY = 'fifty-fifty-run'
// v3 (m13a): the state gained `earlyClearBonus` (13a.4) — v2 saves are
// discarded (not migratable), same policy as v1 → v2.
const SAVE_VERSION = 3

export function save(get: GetFn): void {
  const st = get()
  if (st.phase !== 'run' && st.phase !== 'shop') return // nothing to save outside a run
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state: st }))
}

/** Query (C5): a resumable save exists — the Resume button is visible only
 *  then. False for absent / unparseable / not version 3 / non-resumable. */
export function hasSave(): boolean {
  return parseSave(localStorage.getItem(SAVE_KEY)).some
}

/** Parse + validate a save string; `none` when absent / unparseable / not
 *  version 3 / not resumable (v1/v2 saves predate the collection/earlyClearBonus). */
function parseSave(raw: string | null): Option<RunState> {
  if (raw === null) return none
  let saved: { version?: unknown; state?: RunState }
  try {
    saved = JSON.parse(raw)
  } catch {
    return none
  }
  if (saved.version !== SAVE_VERSION || saved.state === undefined) return none
  const s = saved.state
  if (s.phase !== 'run' && s.phase !== 'shop') return none
  return some(s)
}

export function resume(set: SetFn, rng: Rng): void {
  const saved = parseSave(localStorage.getItem(SAVE_KEY))
  if (!saved.some) return
  const s = saved.value
  // The run continues the same sequence: restore the RNG before any draw.
  rng.restore(s.rngState)
  set((st) => {
    // Preserved: seed, round/blind, cash, charms + order, collection, rngState, runScore.
    st.seed = s.seed
    st.round = s.round
    st.blindIndex = s.blindIndex
    st.cash = s.cash
    st.charms = s.charms
    // 13a.2 keep-unplayed: a mid-blind save may hold unplayed coins in the
    // hand — they are part of the collection, so merge them back before the
    // hand is reset (the run-branch reshuffle then includes them).
    const inHand = s.hand.filter((sl) => sl.kind === 'filled').map((sl) => sl.coin)
    st.deck = { drawPile: [...s.deck.drawPile, ...inHand], discardPile: s.deck.discardPile }
    st.handSize = s.handSize
    st.runScore = s.runScore
    st.earlyClearBonus = s.earlyClearBonus
    // 13a.15: per-round reroll counter (absent in pre-13a.15 saves → 0).
    st.rerollCount = s.rerollCount ?? 0
    st.rngState = s.rngState
    // Reset: hand, play, handPhase, lastScore, current-blind progress.
    st.hand = emptyHand(st.handSize)
    st.play = emptyHand(PLAY_SIZE)
    st.handPhase = 'draw'
    st.lastScore = none
    st.blindScore = 0
    st.phase = s.phase
    if (s.phase === 'run') {
      // Blind start: reset the hand budget and re-reshuffle the whole collection
      // from the restored rngState (discard cleared) — SDD resume semantics.
      const blind = BLINDS[s.blindIndex]
      const baseHands =
        blind.kind === 'boss' && blind.rule === 'shortFuse' ? SHORT_FUSE_HANDS : HANDS_PER_BLIND
      st.handsLeft = baseHands + (s.charms.includes('extraHand') ? 1 : 0)
      st.deck = shuffleCollection(rng, st.deck)
      st.shop = { offers: [] }
    } else {
      // Shop: offers regenerated identically from the restored rngState
      // (deterministic in rngState + charms + handSize); the reroll price
      // counter is restored with the rest of the state.
      st.shop = { offers: generateOffers(rng, s.charms, s.handSize) }
    }
    st.rngState = rng.state()
  })
}
