// 13.7 — the sound map (SDD UX §10): the 16 events, lazy load, the
// concurrency cap, big-event ducking, and rate options. Howler is mocked —
// the test asserts on the Howl options (src / volume / rate) and the
// play/duck/cap behavior, not on real audio.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface MockHowlOpts {
  src: string[]
  volume?: number
  rate?: number
  onload?: () => void
  onloaderror?: () => void
  onplay?: () => void
  onend?: () => void
  onplayerror?: () => void
}

// vi.hoisted: the mock factory runs before the test module body, so the
// class must live in a hoisted closure.
const { MockHowl } = vi.hoisted(() => {
  class MockHowl {
    static all: MockHowl[] = []
    static reset(): void {
      MockHowl.all = []
    }
    opts: MockHowlOpts
    played = false
    constructor(opts: MockHowlOpts) {
      this.opts = opts
      MockHowl.all.push(this)
    }
    play(): this {
      this.played = true
      this.opts.onplay?.()
      return this
    }
    /** Simulate the voice finishing (frees a concurrency slot). */
    finish(): void {
      this.opts.onend?.()
    }
    /** Simulate a missing/broken asset. */
    failLoad(): void {
      this.opts.onloaderror?.()
    }
    failPlay(): void {
      this.played = true
      this.opts.onplayerror?.()
    }
  }
  return { MockHowl }
})

vi.mock('howler', () => ({ Howl: MockHowl }))

// The sfx module state (active voices, missing assets, load flag) is
// per-module — reset it per test with resetModules + a fresh import.
let playSfx: (event: import('./sfx').SfxEvent, opts?: { rate?: number }) => void
let sfxVolume: (event: import('./sfx').SfxEvent) => number

/** The 16 sound-map events (UX §10 table). */
const ALL_EVENTS: import('./sfx').SfxEvent[] = [
  'deal',
  'pick',
  'unpick',
  'discard',
  'toss',
  'land',
  'tierHit',
  'chip',
  'mult',
  'cash',
  'button',
  'reroll',
  'buy',
  'error',
  'winStinger',
  'loseStinger',
]

const last = (): InstanceType<typeof MockHowl> => MockHowl.all[MockHowl.all.length - 1]

beforeEach(async () => {
  MockHowl.reset()
  vi.resetModules()
  const m = await import('./sfx')
  playSfx = m.playSfx
  sfxVolume = m.sfxVolume
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('13.7 — the sound map (UX §10)', () => {
  it('has exactly the 16 events of the UX §10 table, each with a base volume', () => {
    expect(ALL_EVENTS).toHaveLength(16)
    for (const event of ALL_EVENTS) {
      expect(sfxVolume(event)).toBeGreaterThan(0)
      expect(sfxVolume(event)).toBeLessThanOrEqual(1)
    }
  })

  it('plays the event file at its base volume and rate 1', () => {
    playSfx('deal')
    const h = last()
    expect(h.opts.src).toEqual(['/resource/sfx/deal.wav'])
    expect(h.opts.volume).toBe(sfxVolume('deal'))
    expect(h.opts.rate).toBe(1)
    expect(h.played).toBe(true)
  })

  it('applies the rate option (±5% toss/land, rising chip ticks, tier pitch)', () => {
    playSfx('toss', { rate: 1.05 })
    expect(last().opts.rate).toBe(1.05)
    playSfx('chip', { rate: 1 + 5 * 0.06 })
    expect(last().opts.rate).toBeCloseTo(1.3)
    playSfx('tierHit', { rate: 1 + 6 * 0.08 }) // jackpot rank
    expect(last().opts.rate).toBeCloseTo(1.48)
  })

  it('caps concurrency at 8 voices: the 9th play is dropped', () => {
    for (let i = 0; i < 8; i++) playSfx('chip')
    const n = MockHowl.all.length
    playSfx('chip') // over the cap → dropped
    expect(MockHowl.all.length).toBe(n)
    expect(last().played).toBe(true) // still the 8th
    // a voice ending frees a slot
    last().finish()
    playSfx('chip')
    expect(MockHowl.all.length).toBe(n + 1)
  })

  it('ducks the small events for 300ms after a big one (tierHit / stingers)', () => {
    playSfx('tierHit')
    playSfx('chip')
    expect(last().opts.volume).toBeCloseTo(sfxVolume('chip') * 0.4)
    // the big event is not ducked by itself
    playSfx('winStinger')
    expect(last().opts.volume).toBe(sfxVolume('winStinger'))
  })

  it('stops ducking after DUCK_MS', () => {
    const now = vi.spyOn(performance, 'now')
    now.mockReturnValue(1000)
    playSfx('tierHit')
    now.mockReturnValue(1000 + 301)
    playSfx('chip')
    expect(last().opts.volume).toBe(sfxVolume('chip'))
  })

  it('silences an event whose asset failed to load (no retry, no error)', () => {
    // the first play creates the loader Howl for every event
    playSfx('deal')
    const loader = MockHowl.all.find((h) => h.opts.src[0] === '/resource/sfx/cash.wav')
    expect(loader).toBeDefined()
    loader!.failLoad()
    const n = MockHowl.all.length
    playSfx('cash') // missing → no-op
    expect(MockHowl.all.length).toBe(n)
  })
})
