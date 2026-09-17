// @vitest-environment jsdom
//
// Menu screen (C5): the New Run button is a submit button associated with the
// seed form via the HTML `form` attribute (the button lives in the
// .menu-buttons row, OUTSIDE the form — without the association the click
// submits nothing and no run starts). Regression: the association must hold,
// and submitting the form must start a run.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { MenuScreen } from './menu'

describe('Menu — New Run (C5)', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  afterEach(() => {
    cleanup()
    useRunStore.getState().toMenu()
  })

  it('associates the New Run button with the seed form (the button is outside the form)', () => {
    render(<MenuScreen />)
    const btn = screen.getByRole('button', { name: 'New Run' })
    const form = document.querySelector('form')
    // The button is NOT a DOM descendant of the form…
    expect(form?.contains(btn)).toBe(false)
    // …so the `form` attribute must associate them (the regression).
    expect(btn.getAttribute('form')).toBe(form?.id)
    expect(form?.id).toBeTruthy()
  })

  it('submitting the form starts a run (phase → run)', () => {
    render(<MenuScreen />)
    fireEvent.submit(document.querySelector('form')!)
    expect(useRunStore.getState().phase).toBe('run')
  })

  it('starts the run with the typed seed (6–8 chars)', () => {
    render(<MenuScreen />)
    fireEvent.change(document.getElementById('seed')!, { target: { value: 'abcdef' } })
    fireEvent.submit(document.querySelector('form')!)
    const st = useRunStore.getState()
    expect(st.phase).toBe('run')
    expect(st.seed).toBe('abcdef')
  })

  it('starts the run with a random seed when the field is blank', () => {
    render(<MenuScreen />)
    fireEvent.submit(document.querySelector('form')!)
    const st = useRunStore.getState()
    expect(st.phase).toBe('run')
    expect(st.seed.length).toBeGreaterThanOrEqual(6)
    expect(st.seed.length).toBeLessThanOrEqual(8)
  })

  it('disables New Run for an invalid (1–5 char) seed', () => {
    render(<MenuScreen />)
    const btn = screen.getByRole('button', { name: 'New Run' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    fireEvent.change(document.getElementById('seed')!, { target: { value: 'abc' } })
    expect(btn.disabled).toBe(true)
    // Submitting with an invalid seed is a no-op.
    fireEvent.submit(document.querySelector('form')!)
    expect(useRunStore.getState().phase).toBe('menu')
  })
})
