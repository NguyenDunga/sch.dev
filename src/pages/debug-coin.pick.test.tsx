// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { DebugCoinPage } from '@/pages/debug-coin'

afterEach(cleanup)

describe('debug coin pick demo', () => {
  it('renders the hand coin and picks it into the play slot on click', () => {
    const { container } = render(<DebugCoinPage />)
    const handSection = Array.from(container.querySelectorAll('h2')).find((h) => h.textContent === 'Pick / Unpick (click into play)')!
    expect(handSection).toBeTruthy()
    const section = handSection.closest('section')!
    // Initially the coin is in the hand (a hand-coin button), no play slot.
    expect(section.querySelector('.hand-coin')).toBeTruthy()
    expect(section.querySelector('.play-slot')).toBeNull()
    // Click the hand coin → it is picked into the play slot.
    fireEvent.click(section.querySelector('.hand-coin')!)
    expect(section.querySelector('.hand-coin')).toBeNull()
    expect(section.querySelector('.play-slot')).toBeTruthy()
    // Click the play slot coin → unpicked back to the hand.
    fireEvent.click(section.querySelector('.play-slot')!)
    expect(section.querySelector('.hand-coin')).toBeTruthy()
    expect(section.querySelector('.play-slot')).toBeNull()
  })
})
