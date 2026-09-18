// @vitest-environment node
//
// Store fuzzer v2: double-fired actions (StrictMode double effects, double
// clicks), resume in every handPhase, and id-uniqueness checks after every
// action.

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { useRunStore } from '@/state/runStore'
import type { RunState } from '@/state/runStore'

beforeAll(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

function idsOf(s: RunState): number[] {
  const ids: number[] = []
  for (const sl of s.hand) if (sl.kind === 'filled') ids.push(sl.coin.id)
  for (const sl of s.play) if (sl.kind === 'filled') ids.push(sl.coin.id)
  for (const c of s.deck.drawPile) ids.push(c.id)
  for (const c of s.deck.discardPile) ids.push(c.id)
  return ids
}

function check(s: RunState, ctx: string) {
  const ids = idsOf(s)
  const dup = ids.find((id, i) => ids.indexOf(id) !== i)
  expect(dup, `dup id ${dup} after: ${ctx} | hand=${s.hand.map((x) => (x.kind === 'filled' ? x.coin.id : '-')).join(',')} play=${s.play.map((x) => (x.kind === 'filled' ? x.coin.id : '-')).join(',')}`).toBeUndefined()
}

let rngState = 42
function rnd(n: number): number {
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff
  return rngState % n
}

const hf = (s: RunState) => s.hand.map((sl, i) => (sl.kind === 'filled' ? i : -1)).filter((i) => i >= 0)
const pf = (s: RunState) => s.play.map((sl, i) => (sl.kind === 'filled' ? i : -1)).filter((i) => i >= 0)

function act(name: string, fn: () => void, double = false) {
  fn()
  if (double) fn() // double-fire
  check(useRunStore.getState(), name)
}

function step(i: number) {
  const st = useRunStore.getState()
  const s = st
  if (s.phase === 'menu' || s.phase === 'gameover' || s.phase === 'runEnd') {
    act(`startRun@${i}`, () => st.startRun(`f-${rnd(100000)}`))
    return
  }
  if (s.phase === 'shop') {
    const r = rnd(8)
    if (r < 2 && s.shop.offers.length) act(`buy@${i}`, () => st.buy(s.shop.offers[rnd(s.shop.offers.length)]))
    else if (r === 2) act('reroll', () => st.reroll())
    else if (r === 3) act('leaveShop', () => st.leaveShop())
    else if (r === 4) act('save+resume', () => { st.save(); st.resume() }, true)
    return
  }
  // run
  const r = rnd(14)
  if (s.handPhase === 'draw') {
    // the UI auto-draws (an effect — double-fired under StrictMode)
    act(`drawHand@${i} (double)`, () => st.drawHand(), true)
  } else if (s.handPhase === 'play') {
    const H = hf(s)
    const P = pf(s)
    if (r < 4 && H.length) act(`pick@${i}`, () => st.pickCoin(H[rnd(H.length)]), true)
    else if (r < 5 && P.length) act(`unpick@${i}`, () => st.unpickCoin(P[rnd(P.length)]), true)
    else if (r < 6 && P.length >= 2) act(`move@${i}`, () => st.movePlayCoin(P[0], P[1]), true)
    else if (r < 8 && H.length) act(`discard@${i}`, () => st.discard(H[rnd(H.length)]), true)
    else if (P.length) {
      act(`confirm@${i}`, () => st.confirmPlay(), true)
      const s2 = useRunStore.getState()
      if (s2.handPhase === 'buff') {
        const ei = s2.play.findIndex((sl) => sl.kind === 'filled' && sl.coin.effects.some((e) => e.kind === 'echo'))
        if (ei !== -1 && rnd(2) === 0) act('reflip', () => st.echoReflip(ei), true)
        // the UI auto-scores (a timer — can double-fire) + the user may click
        act(`score@${i} (double)`, () => st.score(), true)
      }
    } else if (r === 9) act('save+resume', () => { st.save(); st.resume() })
  } else if (s.handPhase === 'toss' || s.handPhase === 'score') {
    // transient — the UI may save here
    if (rnd(2) === 0) act(`save+resume@${i} (${s.handPhase})`, () => { st.save(); st.resume() })
  } else if (s.handPhase === 'buff') {
    if (rnd(3) === 0) act(`save+resume@${i} (buff)`, () => { st.save(); st.resume() })
    act(`score@${i} (double)`, () => st.score(), true)
  }
}

describe('store fuzzer v2 — double-fired actions + resume anywhere', () => {
  it('no duplicates over 3000 steps', () => {
    for (let i = 0; i < 3000; i++) step(i)
  })
})
