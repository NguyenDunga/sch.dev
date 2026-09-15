// @vitest-environment jsdom
//
// 13.2 — toss + echo (unit + component, jsdom):
//   - settleRotation lands the two-face disc on the store-resolved face
//     (H front = 0 mod 360, T back = 180 mod 360) for both spin counts
//   - motion allowed → the 3D flip disc (both faces) labelled with the face
//   - reduced motion → the 2D cross-fade coin, no 3D flip
//
// The spring-bouncy arc/tumble is framer-motion (not assertable in jsdom);
// the timing lives in lib/motion (TOSS/ECHO). The landing face is asserted
// here and in the run-screen integration test (run.juice.test.tsx).

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { TossCoin } from './toss-coin'
import { settleRotation } from './toss'

/**
 * A matchMedia stub for framer's useReducedMotion: motion-dom's
 * initPrefersReducedMotion reads `window.matchMedia("(prefers-reduced-motion)")`
 * once and subscribes to its `change` events. Installed before the first
 * render; `setReduced` flips the preference for later renders.
 */
function installReducedMotionStub() {
  const listeners: Array<() => void> = []
  const mql = {
    matches: false,
    media: '(prefers-reduced-motion)',
    onchange: null,
    addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
    addListener: (fn: () => void) => listeners.push(fn),
    removeListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
    dispatchEvent: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return {
    setReduced: (reduced: boolean) => {
      mql.matches = reduced
      listeners.forEach((fn) => fn())
    },
  }
}

let reduced: { setReduced: (reduced: boolean) => void }

beforeAll(() => {
  reduced = installReducedMotionStub()
})

afterEach(() => {
  cleanup()
  reduced.setReduced(false)
})

describe('13.2 — settleRotation (lands on Slot.face)', () => {
  it('heads lands front-up: whole spins, 0 mod 360', () => {
    expect(settleRotation('H', 2)).toBe(720)
    expect(settleRotation('H', 1)).toBe(360)
    expect(settleRotation('H', 2) % 360).toBe(0)
  })

  it('tails lands back-up: whole spins + 180', () => {
    expect(settleRotation('T', 2)).toBe(900)
    expect(settleRotation('T', 1)).toBe(540)
    expect(settleRotation('T', 2) % 360).toBe(180)
  })
})

describe('13.2 — toss coin rendering', () => {
  it('motion allowed: the 3D flip disc with both faces, labelled with the face', () => {
    const { container } = render(<TossCoin face="H" index={0} effects={[]} />)
    const flip = container.querySelector('.toss-coin-flip')
    expect(flip).toBeTruthy()
    expect(container.querySelector('.toss-face--heads')).toBeTruthy()
    expect(container.querySelector('.toss-face--tails')).toBeTruthy()
    expect(flip?.getAttribute('aria-label')).toBe('heads')
  })

  it('echo (quick) renders the same flip disc on the face', () => {
    const { container } = render(<TossCoin face="T" index={2} effects={[]} quick />)
    expect(container.querySelector('.toss-coin-flip')?.getAttribute('aria-label')).toBe('tails')
  })

  it('reduced motion: the 2D cross-fade coin, no 3D flip', () => {
    reduced.setReduced(true)
    const { container } = render(<TossCoin face="T" index={0} effects={[]} />)
    expect(container.querySelector('.toss-coin--2d')).toBeTruthy()
    expect(container.querySelector('.toss-coin-flip')).toBeNull()
    expect(container.querySelector('.coin-disc--t')?.getAttribute('aria-label')).toBe('tails')
  })
})
