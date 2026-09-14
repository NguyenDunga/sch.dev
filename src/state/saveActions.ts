// C9 — Save / resume actions (M11).
//
// Save is explicit only (no autosave): { version: 2, state } to localStorage
// in the run/shop phases. Resume is a no-op when the save is absent,
// unparseable, not version 2, or not resumable. Action bodies are module-level
// functions (≤60 lines, NASA practice); the store wires them up.

import { BLINDS, HANDS_PER_BLIND, PLAY_SIZE, SHORT_FUSE_HANDS } from '@/core/balance'
import { shuffleCollection } from '@/core/deck'
import { emptyHand, none, some } from '@/core/helpers'
import type { Rng } from '@/core/rng'
import type { Option, RunState } from '@/core/types'
import type { GetFn, SetFn } from './storeTypes'
import { generateOffers } from './shopActions'

const SAVE_KEY = 'fifty-fifty-run'
const SAVE_VERSION = 2

export function save(get: GetFn): void {
  const st = get()
  if (st.phase !== 'run' && st.phase !== 'shop') return // nothing to save outside a run
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, state: st }))
}

/** Parse + validate a save string; `none` when absent / unparseable / not
 *  version 2 / not resumable (v1 saves predate the coin collection). */
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
    st.deck = s.deck
    st.handSize = s.handSize
    st.runScore = s.runScore
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
      st.shop = { offers: [], rerollUsed: false }
    } else {
      // Shop: offers regenerated identically from the restored rngState
      // (deterministic in rngState + charms + handSize); rerollUsed preserved.
      st.shop = {
        offers: generateOffers(rng, s.charms, s.handSize),
        rerollUsed: s.shop.rerollUsed,
      }
    }
    st.rngState = rng.state()
  })
}
