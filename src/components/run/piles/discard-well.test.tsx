// @vitest-environment jsdom
// Discard well — clicking the well toggles the read-only pile panel (shared
// with the deck): the coins discarded this blind, with the count.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { DiscardWell } from './piles'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'

function Harness() {
  const wellRef = useRef<HTMLDivElement>(null)
  return <DiscardWell wellRef={wellRef} />
}

describe('DiscardWell', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  afterEach(() => {
    cleanup()
    useRunStore.getState().toMenu()
  })

  it('shows the discard-pile count and starts closed', () => {
    const store = useRunStore
    store.getState().startRun('abcdef')
    store.getState().drawHand()
    store.getState().discard(0)
    render(<Harness />)
    const btn = screen.getByRole('button', { name: 'Show discard pile' })
    expect(btn).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Discard pile' })).toBeNull()
  })

  it('clicking toggles the pile panel (open → close)', () => {
    const store = useRunStore
    store.getState().startRun('abcdef')
    store.getState().drawHand()
    store.getState().discard(0)
    store.getState().discard(1)
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Show discard pile' }))
    const panel = screen.getByRole('dialog', { name: 'Discard pile' })
    expect(panel).toBeTruthy()
    expect(screen.getByText('2 coins')).toBeTruthy()

    // The panel's Close button closes it.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog', { name: 'Discard pile' })).toBeNull()

    // And the well button re-opens it.
    fireEvent.click(screen.getByRole('button', { name: 'Show discard pile' }))
    expect(screen.getByRole('dialog', { name: 'Discard pile' })).toBeTruthy()
  })

  it('an empty pile shows the empty note', () => {
    const store = useRunStore
    store.getState().startRun('abcdef')
    store.getState().drawHand()
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Show discard pile' }))
    expect(screen.getByText('Nothing discarded this blind')).toBeTruthy()
  })
})
