// Shared helpers for the run-store test suites (handFlow / charms / shop /
// progression / saveLoad).

import type { HandPhase, HandSlot } from '@/core/types'
import { createRunStore } from './runStore'

/** The coin id in a slot, or -1 when the slot is empty. */
export const coinId = (slot: HandSlot): number => (slot.kind === 'filled' ? slot.coin.id : -1)

/** A store with a run started and the first hand drawn (full 8-coin hand). */
export function drawnStore(seed: string) {
  const store = createRunStore()
  store.getState().startRun(seed)
  store.getState().drawHand()
  return store
}

/** The next step of the handPhase cycle (M4.1). */
export const NEXT: Record<HandPhase, HandPhase> = {
  draw: 'play',
  play: 'toss',
  toss: 'buff',
  buff: 'score',
  score: 'draw',
}

/** In-memory localStorage (the node test env has none; the store only uses
 *  getItem/setItem). */
export function makeLocalStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k) : null),
    setItem: (k: string, v: string) => {
      m.set(k, v)
    },
    clear: () => m.clear(),
  }
}
