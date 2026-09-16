// @vitest-environment jsdom
//
// 13a.10 — first-run onboarding hint:
//   - shown only on the first run (the localStorage flag is set on first
//     show and on dismiss — persisted)
//   - never blocks input (pointer-events: none on the banner, auto on the ×)
//   - the × dismisses it (and persists the dismissal)

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { makeLocalStorage } from '@/state/testHelpers'
import { OnboardingHint } from './onboarding-hint'

/** The run.css contract (the test env never loads the stylesheet): the
 *  banner must be pointer-transparent, only the × live. */
const RUN_CSS = readFileSync('src/components/run/run.css', 'utf8')
const onboardingCss = (() => {
  const start = RUN_CSS.indexOf('.onboarding-hint {')
  if (start === -1) throw new Error('run.css: .onboarding-hint rule not found')
  return RUN_CSS.slice(start, RUN_CSS.indexOf('/* -- action bar'))
})()

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('13a.10 — first-run onboarding hint', () => {
  it('is shown on the first run (no flag) and explains the three core gestures', () => {
    render(<OnboardingHint />)
    const note = screen.getByRole('note', { name: /getting started/i })
    expect(note.textContent).toMatch(/drag a coin to the play row/i)
    expect(note.textContent).toMatch(/bin to discard/i)
    expect(note.textContent).toMatch(/match a pattern to score/i)
  })

  it('persists the flag on first show (the hint never comes back)', () => {
    render(<OnboardingHint />)
    expect(localStorage.getItem('fifty-fifty-onboarded')).toBe('1')
  })

  it('is not shown once the flag is set', () => {
    localStorage.setItem('fifty-fifty-onboarded', '1')
    const { container } = render(<OnboardingHint />)
    expect(container.querySelector('.onboarding-hint')).toBeNull()
  })

  it('the × dismisses it and the dismissal is persisted', () => {
    render(<OnboardingHint />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss hint/i }))
    expect(screen.queryByRole('note')).toBeNull()
    expect(localStorage.getItem('fifty-fifty-onboarded')).toBe('1')
  })

  it('never blocks input: the banner is pointer-transparent, only the × is live (CSS contract)', () => {
    render(<OnboardingHint />)
    expect(screen.getByRole('note').classList.contains('onboarding-hint')).toBe(true)
    expect(screen.getByRole('button', { name: /dismiss hint/i }).classList.contains('onboarding-hint-close')).toBe(true)
    // The a11y-critical contract (UX §3 / "never block input").
    expect(onboardingCss).toMatch(/\.onboarding-hint \{[^}]*pointer-events: none/s)
    expect(onboardingCss).toMatch(/\.onboarding-hint-close \{[^}]*pointer-events: auto/s)
  })
})
