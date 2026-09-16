// @vitest-environment jsdom
//
// 13a.10 — first-run onboarding hint, on the run screen:
//   - the first run shows the hint (an overlay — position: fixed, so
//     showing/dismissing it never shifts the layout)
//   - dismissing it (×) removes it for good (the flag is persisted)
//   - a later run (flag set) never shows it again

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  run.13a.test.tsx). */
const reduced = (() => {
  const listeners: Array<() => void> = []
  const mql = {
    matches: false,
    media: '(prefers-reduced-motion)',
    addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return {
    setReduced: (r: boolean) => {
      mql.matches = r
      listeners.forEach((fn) => fn())
    },
  }
})()

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  reduced.setReduced(false)
})

/** Mount the run screen with a fresh run + drawn hand. */
function mountRun() {
  useRunStore.getState().startRun('onboard')
  useRunStore.getState().drawHand()
  return render(<RunScreen />)
}

describe('13a.10 — the first-run hint on the run screen', () => {
  it('shows the hint on the first run (an overlay — no layout shift)', () => {
    mountRun()
    const note = screen.getByRole('note', { name: /getting started/i })
    expect(note).toBeTruthy()
    // The hint is a fixed overlay: showing or dismissing it cannot move the
    // play area (the "no layout shift" accept).
    expect(note.classList.contains('onboarding-hint')).toBe(true)
  })

  it('dismissing the hint removes it for good (the flag is persisted)', () => {
    mountRun()
    fireEvent.click(screen.getByRole('button', { name: /dismiss hint/i }))
    expect(screen.queryByRole('note')).toBeNull()
    expect(localStorage.getItem('fifty-fifty-onboarded')).toBe('1')
    // A later run (same storage) never shows it again.
    cleanup()
    mountRun()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('a run after the first never shows the hint', () => {
    localStorage.setItem('fifty-fifty-onboarded', '1')
    mountRun()
    expect(screen.queryByRole('note')).toBeNull()
  })
})
