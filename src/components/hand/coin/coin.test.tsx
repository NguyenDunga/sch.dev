// @vitest-environment jsdom
// Coin component tests — coverage only (no style assertions).
//
// Verifies:
// - Coin renders without crashing (all face states, with/without effects)
// - Resolver is pure and deterministic
// - Event hooks fire correctly
// - No errors thrown for edge cases

import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Coin } from './coin'
import { resolveCoinFace, resolveCoinFaces } from './resolver/resolver'
import { fireCoinEvent } from './coin-events'
import type { CoinEffect } from '@/core/types'

describe('Coin — render coverage', () => {
  it('renders face-down without crashing', () => {
    expect(() => render(<Coin face={undefined} effects={[]} coinId="c1" />)).not.toThrow()
  })

  it('renders H face without crashing', () => {
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" />)).not.toThrow()
  })

  it('renders T face without crashing', () => {
    expect(() => render(<Coin face="T" effects={[]} coinId="c1" />)).not.toThrow()
  })

  it('renders with all effects without crashing', () => {
    const effects: CoinEffect[] = [
      { kind: 'weight', favored: 'H' },
      { kind: 'heads' },
      { kind: 'tails' },
      { kind: 'chaos' },
      { kind: 'echo' },
      { kind: 'magnetic' },
      { kind: 'reverse' },
      { kind: 'tax' },
      { kind: 'jackpot' },
      { kind: 'draw', count: 2 },
    ]
    expect(() => render(<Coin face="H" effects={effects} coinId="c1" />)).not.toThrow()
    expect(() => render(<Coin face="T" effects={effects} coinId="c1" />)).not.toThrow()
  })

  it('renders with custom size without crashing', () => {
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" size={32} />)).not.toThrow()
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" size={128} />)).not.toThrow()
  })

  it('renders with deal animation without crashing', () => {
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" dealIndex={0} />)).not.toThrow()
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" dealIndex={4} />)).not.toThrow()
  })

  it('renders in shaking state without crashing', () => {
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" shaking shakeKey={1} />)).not.toThrow()
  })
})

describe('Coin — resolver (pure function)', () => {
  it('is deterministic: same input → same output', () => {
    const effects: CoinEffect[] = [
      { kind: 'weight', favored: 'H' },
      { kind: 'jackpot' },
    ]
    const r1 = resolveCoinFace({ face: 'H', effects })
    const r2 = resolveCoinFace({ face: 'H', effects })
    expect(r1).toEqual(r2)
  })

  it('resolves both sides independently', () => {
    const { H, T } = resolveCoinFaces([{ kind: 'weight', favored: 'H' }])
    expect(H.face).toBe('H')
    expect(T.face).toBe('T')
    expect(H.color).not.toBe(T.color)
  })

  it('handles empty effects', () => {
    const r = resolveCoinFace({ face: 'H', effects: [] })
    expect(r.modifiers).toEqual([])
  })
})

describe('Coin — event hooks', () => {
  it('fires onMount when provided', async () => {
    const onMount = vi.fn()
    render(<Coin face="H" effects={[]} coinId="c1" events={{ onMount }} />)
    await new Promise<void>(r => queueMicrotask(() => r()))
    expect(onMount).toHaveBeenCalledTimes(1)
    expect(onMount.mock.calls[0][0].coinId).toBe('c1')
    expect(onMount.mock.calls[0][0].face).toBe('H')
  })

  it('does not fire onMount when no events', () => {
    expect(() => render(<Coin face="H" effects={[]} coinId="c1" />)).not.toThrow()
  })

  it('fireCoinEvent is a no-op with no hooks', () => {
    expect(() => fireCoinEvent({}, 'mount', { coinId: 'c1' })).not.toThrow()
  })

  it('fireCoinEvent calls the handler', () => {
    const onToss = vi.fn()
    fireCoinEvent({ onToss }, 'toss', { coinId: 'c1', face: 'H' })
    expect(onToss).toHaveBeenCalledTimes(1)
    expect(onToss.mock.calls[0][0].coinId).toBe('c1')
    expect(onToss.mock.calls[0][0].face).toBe('H')
    expect(onToss.mock.calls[0][0].timestamp).toBeGreaterThan(0)
  })
})
