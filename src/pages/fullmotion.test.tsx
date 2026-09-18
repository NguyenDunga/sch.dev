// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

// matchMedia stub for framer's useReducedMotion (same pattern as
// run.13a.test.tsx) — this file always runs with FULL motion.
const mql = {
  matches: false, // FULL motion
  media: '(prefers-reduced-motion)',
  addEventListener: () => {},
  removeEventListener: () => {},
}
vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

let errors: string[] = []

describe('full-motion repro', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
    errors = []
    vi.spyOn(console, 'error').mockImplementation((...args) => { errors.push(args.map(String).join(' ')) })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('plays 3 hands with full motion', async () => {
    useRunStore.getState().startRun('full-1')
    render(<StrictMode><RunScreen /></StrictMode>)
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'))
    for (let h = 0; h < 3; h++) {
      for (let p = 0; p < 3; p++) {
        const st = useRunStore.getState()
        if (st.handPhase !== 'play') break
        const i = st.hand.findIndex((sl) => sl.kind === 'filled')
        if (i === -1) break
        useRunStore.getState().pickCoin(i)
      }
      const st2 = useRunStore.getState()
      if (st2.handPhase === 'play' && st2.play.some((sl) => sl.kind === 'filled')) {
        useRunStore.getState().confirmPlay()
        useRunStore.getState().score()
      }
    }
    await new Promise((r) => setTimeout(r, 3000)) // let animations/choreo run
    const bad = errors.filter((e) => e.includes('same key') || e.includes('re-render'))
    console.log('errors:', errors.length, errors.slice(0, 3).join(' | '))
    expect(bad).toEqual([])
  }, 20000)
})
