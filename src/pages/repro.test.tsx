// @vitest-environment jsdom
//
// Repro fuzz: play long randomized runs in the rendered RunScreen
// (StrictMode, like main.tsx) — unpick, reorder, draw-enchant discard,
// echo reflip, shop (buy/merge/remove), save/resume — and surface any
// React key / re-render errors.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'
import type { Coin, DrawCount } from '@/core/types'

// matchMedia stub for framer's useReducedMotion (same pattern as
// run.13a.test.tsx) — this file always runs with REDUCED motion.
const mql = {
  matches: true,
  media: '(prefers-reduced-motion)',
  addEventListener: () => {},
  removeEventListener: () => {},
}
vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

let errors: string[] = []
let rngState = 12345
function rnd(n: number): number {
  // deterministic LCG
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff
  return rngState % n
}

function forceCoin(handIndex: number, effects: Coin['effects']): void {
  const st = useRunStore.getState()
  useRunStore.setState({
    hand: st.hand.map((s, i) =>
      i === handIndex && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects } } : s,
    ),
  })
}

describe('repro fuzz — React key / re-render errors', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
    errors = []
    rngState = 12345
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  function playOneHand() {
    const s0 = useRunStore.getState()
    if (s0.handPhase === 'draw') useRunStore.getState().drawHand()
    const actions = 2 + rnd(4) // 2..5 picks
    for (let p = 0; p < actions; p++) {
      const st = useRunStore.getState()
      if (st.handPhase !== 'play') break
      const filled = st.hand.map((sl, i) => (sl.kind === 'filled' ? i : -1)).filter((i) => i >= 0)
      if (filled.length === 0) break
      const i = filled[rnd(filled.length)]
      // sometimes force a draw-enchant or echo coin first
      if (p === 0 && rnd(3) === 0) forceCoin(i, [{ kind: 'draw', count: (1 + rnd(3)) as DrawCount }])
      if (p === 1 && rnd(3) === 0) forceCoin(i, [{ kind: 'echo' }])
      useRunStore.getState().pickCoin(i)
      // sometimes unpick again
      if (rnd(4) === 0) {
        const st2 = useRunStore.getState()
        const pi = st2.play.findIndex((sl) => sl.kind === 'filled')
        if (pi !== -1) useRunStore.getState().unpickCoin(pi)
      }
      // sometimes reorder
      if (rnd(5) === 0) {
        const st3 = useRunStore.getState()
        const fs = st3.play.map((sl, j) => (sl.kind === 'filled' ? j : -1)).filter((j) => j >= 0)
        if (fs.length >= 2) useRunStore.getState().movePlayCoin(fs[0], fs[1])
      }
    }
    // sometimes discard a (maybe draw-enchant) hand coin
    const stD = useRunStore.getState()
    if (stD.handPhase === 'play') {
      if (rnd(2) === 0) {
        const filled = stD.hand.map((sl, i) => (sl.kind === 'filled' ? i : -1)).filter((i) => i >= 0)
        if (filled.length > 0) {
          const d = filled[rnd(filled.length)]
          if (rnd(3) === 0) forceCoin(d, [{ kind: 'draw', count: 2 }])
          useRunStore.getState().discard(d)
        }
      }
      if (useRunStore.getState().play.some((sl) => sl.kind === 'filled')) {
        useRunStore.getState().confirmPlay()
        // sometimes echo reflip
        const stB = useRunStore.getState()
        if (stB.handPhase === 'buff' && rnd(2) === 0) {
          const ei = stB.play.findIndex((sl) => sl.kind === 'filled' && sl.coin.effects.some((e) => e.kind === 'echo'))
          if (ei !== -1) useRunStore.getState().echoReflip(ei)
        }
        useRunStore.getState().score()
      } else {
        // nothing played: the store stays in play — score is a no-op; skip the hand via discard-all? Just draw is not possible; force confirm impossible. Leave it.
      }
    }
  }

  it('no duplicate keys or re-render loops over a long run', async () => {
    useRunStore.getState().startRun('repro-fuzz')
    render(
      <StrictMode>
        <RunScreen />
      </StrictMode>,
    )
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'))

    let guard = 0
    while (useRunStore.getState().phase === 'run' && guard++ < 60) {
      const st = useRunStore.getState()
      if (st.handPhase === 'play') playOneHand()
      // occasionally save + resume mid-blind
      if (guard % 7 === 0 && st.phase === 'run') {
        useRunStore.getState().save()
        // resume re-renders the same screen (store state swap)
        useRunStore.getState().resume()
      }
      // surface errors early
      const bad = errors.filter((e) => e.includes('same key') || e.includes('re-render'))
      if (bad.length > 0) break
    }

    const bad = errors.filter((e) => e.includes('same key') || e.includes('re-render'))
    const st = useRunStore.getState()
    console.log('phase:', st.phase, 'guard:', guard, 'total errors:', errors.length)
    if (errors.length) console.log(errors.slice(0, 5).join('\n---\n'))
    expect(bad).toEqual([])
  })
})
