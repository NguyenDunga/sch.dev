// /debug/coin — the sample data: every coin effect, the effect
// combinations, and the size ladder (the page renders them).

import type { CoinEffect } from '@/core/types'

// ── Effect samples ───────────────────────────────────────────────────────────

export const ALL_EFFECTS: { label: string; effects: CoinEffect[] }[] = [
  { label: 'No effects', effects: [] },
  { label: 'Weight H', effects: [{ kind: 'weight', favored: 'H' }] },
  { label: 'Weight T', effects: [{ kind: 'weight', favored: 'T' }] },
  { label: 'Heads', effects: [{ kind: 'heads' }] },
  { label: 'Tails', effects: [{ kind: 'tails' }] },
  { label: 'Chaos', effects: [{ kind: 'chaos' }] },
  { label: 'Echo', effects: [{ kind: 'echo' }] },
  { label: 'Magnetic', effects: [{ kind: 'magnetic' }] },
  { label: 'Reverse', effects: [{ kind: 'reverse' }] },
  { label: 'Tax', effects: [{ kind: 'tax' }] },
  { label: 'Jackpot', effects: [{ kind: 'jackpot' }] },
  { label: 'Draw 1', effects: [{ kind: 'draw', count: 1 }] },
  { label: 'Draw 2', effects: [{ kind: 'draw', count: 2 }] },
  { label: 'Draw 3', effects: [{ kind: 'draw', count: 3 }] },
]

// ── Combination samples ──────────────────────────────────────────────────────

export const COMBOS: { label: string; effects: CoinEffect[] }[] = [
  { label: 'Weight H + Jackpot', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'jackpot' }] },
  { label: 'Weight H + Reverse', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'reverse' }] },
  { label: 'Weight H + Tax', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'tax' }] },
  { label: 'Heads + Echo', effects: [{ kind: 'heads' }, { kind: 'echo' }] },
  { label: 'Chaos + Magnetic', effects: [{ kind: 'chaos' }, { kind: 'magnetic' }] },
  { label: 'Tax + Jackpot', effects: [{ kind: 'tax' }, { kind: 'jackpot' }] },
  { label: 'Weight H + Heads + Jackpot', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'heads' }, { kind: 'jackpot' }] },
  { label: 'Tails + Reverse + Jackpot', effects: [{ kind: 'tails' }, { kind: 'reverse' }, { kind: 'jackpot' }] },
  { label: 'All effects', effects: [
    { kind: 'weight', favored: 'H' },
    { kind: 'heads' },
    { kind: 'chaos' },
    { kind: 'echo' },
    { kind: 'magnetic' },
    { kind: 'reverse' },
    { kind: 'tax' },
    { kind: 'jackpot' },
    { kind: 'draw', count: 3 },
  ]},
]

// ── Size samples ─────────────────────────────────────────────────────────────

export const SIZES = [24, 32, 40, 56, 72, 96] as const
