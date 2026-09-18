// @vitest-environment jsdom
//
// 13.9 — Win scene: the won run-end (trophy + one-shot confetti + win
// stinger). The win is hard to reach in play, so this suite covers it both
// ways: the REAL store path (clearing the last blind via score/finishScore,
// as in progression M10.5) and the rendered scene (StrictMode, reduced
// motion, celebration exactly once, buttons work, no console errors).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { BLINDS, HEAVY_TARGET_BONUS, HEAVY_TARGET_MULT, START_CASH } from '@/core/balance'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import * as particles from '@/components/juice/particles'
import * as sfx from '@/components/juice/sfx'
import { RunEndScreen } from './run-end'

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

function winViaStore(seed: string): void {
  // The real win path (M10.5): the last blind's EFFECTIVE target already met
  // (blind 11 is the Heavy Target boss: target × 1.5), play the final hand,
  // score, finish → runEnd + won.
  const store = useRunStore
  store.getState().startRun(seed)
  store.setState({
    blindIndex: 11,
    round: 4,
    blindScore: BLINDS[11].target * HEAVY_TARGET_MULT,
    handsLeft: 1,
  })
  store.getState().drawHand()
  store.getState().pickCoin(0)
  store.getState().confirmPlay()
  store.getState().score()
  store.getState().finishScore()
}

describe('13.9 — win scene', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
    errors = []
    particles.disposeParticles()
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '))
    })
    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      errors.push(args.map(String).join(' '))
    })
    vi.spyOn(sfx, 'playSfx')
    vi.spyOn(particles, 'emitConfetti')
  })

  afterEach(() => {
    cleanup()
    particles.disposeParticles()
    vi.restoreAllMocks()
  })

  it('the real store path wins: last blind cleared → runEnd + won', () => {
    winViaStore('win-1')
    const st = useRunStore.getState()
    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(true)
    expect(st.cash).toBe(START_CASH + BLINDS[11].reward + HEAVY_TARGET_BONUS)
  })

  it('win scene renders from the won run without any console error (StrictMode)', () => {
    winViaStore('win-2')
    render(
      <StrictMode>
        <RunEndScreen />
      </StrictMode>,
    )
    const container = document.querySelector('.run-end')!
    expect(container).toBeTruthy()
    expect(container.classList.contains('run-end--win')).toBe(true)
    expect(container.querySelector('.run-end-trophy')).toBeTruthy()
    expect(container.querySelector('.run-end-title')?.textContent).toBe('Run complete!')
    expect(screen.getByText('12 / 12')).toBeTruthy()
    expect(screen.getByRole('button', { name: /new run/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /menu/i })).toBeTruthy()
    expect(errors).toEqual([])
  })

  it('the celebration fires exactly once (StrictMode double-mount safe): one confetti burst + one win stinger', () => {
    winViaStore('win-3')
    render(
      <StrictMode>
        <RunEndScreen />
      </StrictMode>,
    )
    expect(particles.emitConfetti).toHaveBeenCalledTimes(1)
    expect(particles.emitConfetti).toHaveBeenCalledWith({ count: 300 })
    const stingers = vi.mocked(sfx.playSfx).mock.calls.filter((c) => c[0] === 'winStinger')
    expect(stingers).toHaveLength(1)
    expect(particles.activeParticleCount()).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })

  it('a lost run has no trophy, no confetti, and plays the lose stinger', () => {
    useRunStore.getState().startRun('win-lose')
    useRunStore.setState({ phase: 'runEnd', won: false, runScore: 400, cash: 8, blindScore: 100, blindIndex: 3 })
    render(
      <StrictMode>
        <RunEndScreen />
      </StrictMode>,
    )
    expect(document.querySelector('.run-end-trophy')).toBeNull()
    expect(document.querySelector('.run-end--win')).toBeNull()
    expect(particles.emitConfetti).not.toHaveBeenCalled()
    expect(sfx.playSfx).toHaveBeenCalledWith('loseStinger')
    expect(screen.getByText('3 / 12')).toBeTruthy()
    expect(errors).toEqual([])
  })

  it('New Run starts a fresh run from the win scene', () => {
    winViaStore('win-4')
    render(
      <StrictMode>
        <RunEndScreen />
      </StrictMode>,
    )
    fireEvent.click(screen.getByRole('button', { name: /new run/i }))
    const st = useRunStore.getState()
    expect(st.phase).toBe('run')
    expect(st.won).toBe(false)
    expect(st.blindIndex).toBe(0)
    expect(errors).toEqual([])
  })

  it('Menu returns to the menu from the win scene', () => {
    winViaStore('win-5')
    render(
      <StrictMode>
        <RunEndScreen />
      </StrictMode>,
    )
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    expect(useRunStore.getState().phase).toBe('menu')
    expect(errors).toEqual([])
  })
})
