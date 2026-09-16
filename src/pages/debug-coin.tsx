// /debug/coin — visual test page for all coin visual code.
//
// Shows every coin state: face-down, H, T, all 9 effects individually,
// and all effect combinations. Desktop-only dev tool.

import { Coin } from '@/components/hand/coin'
import type { CoinEffect, Face } from '@/core/types'

// ── Effect samples ───────────────────────────────────────────────────────────

const ALL_EFFECTS: { label: string; effects: CoinEffect[] }[] = [
  { label: 'No effects', effects: [] },
  { label: 'Weight H', effects: [{ kind: 'weight', favored: 'H' }] },
  { label: 'Weight T', effects: [{ kind: 'weight', favored: 'T' }] },
  { label: 'DoubleSide H', effects: [{ kind: 'doubleSide', favored: 'H' }] },
  { label: 'DoubleSide T', effects: [{ kind: 'doubleSide', favored: 'T' }] },
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

const COMBOS: { label: string; effects: CoinEffect[] }[] = [
  { label: 'Weight H + Jackpot', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'jackpot' }] },
  { label: 'Weight H + Reverse', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'reverse' }] },
  { label: 'Weight H + Tax', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'tax' }] },
  { label: 'DoubleSide H + Echo', effects: [{ kind: 'doubleSide', favored: 'H' }, { kind: 'echo' }] },
  { label: 'Chaos + Magnetic', effects: [{ kind: 'chaos' }, { kind: 'magnetic' }] },
  { label: 'Tax + Jackpot', effects: [{ kind: 'tax' }, { kind: 'jackpot' }] },
  { label: 'Weight H + DoubleSide H + Jackpot', effects: [{ kind: 'weight', favored: 'H' }, { kind: 'doubleSide', favored: 'H' }, { kind: 'jackpot' }] },
  { label: 'All 9 effects', effects: [
    { kind: 'weight', favored: 'H' },
    { kind: 'doubleSide', favored: 'T' },
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

const SIZES = [24, 32, 40, 56, 72, 96] as const

// ── Page ─────────────────────────────────────────────────────────────────────

function CoinRow({ title, faces, effectsList }: { title: string; faces: Face[]; effectsList: { label: string; effects: CoinEffect[] }[] }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>{title}</h2>
      {faces.map((face) => (
        <div key={face} style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{face === 'H' ? 'Heads' : 'Tails'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: '1rem' }}>
            {effectsList.map(({ label, effects }) => (
              <div key={label} style={{ textAlign: 'center', padding: '0.5rem' }}>
                <Coin face={face} effects={effects} coinId={`${face}-${label}`} size={56} />
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', display: 'block', marginTop: '0.3rem' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function SizeRow({ title, face }: { title: string; face: Face | undefined }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>{title}</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        {SIZES.map((s) => (
          <div key={s} style={{ textAlign: 'center' }}>
            <Coin face={face} effects={[]} coinId={`${title}-${s}`} size={s} />
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>{s}px</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AnimRow() {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Animation States</h2>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
        <div style={{ textAlign: 'center' }}>
          <Coin face="H" effects={[]} coinId="deal-0" size={56} dealIndex={0} />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Deal 0</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Coin face="H" effects={[]} coinId="deal-2" size={56} dealIndex={2} />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Deal 2</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Coin face="H" effects={[]} coinId="deal-4" size={56} dealIndex={4} />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Deal 4</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Coin face="H" effects={[]} coinId="shake" size={56} shaking shakeKey={1} />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Shaking</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Coin face="H" effects={[]} coinId="drag" size={56} dragging />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Dragging</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Coin face="H" effects={[]} coinId="disabled" size={56} enabled={false} />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Disabled</span>
        </div>
      </div>
    </section>
  )
}

export function DebugCoinPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '60rem', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1rem' }}>
        Debug: Coin Visuals
      </h1>
      <SizeRow title="Face-down" face={undefined} />
      <SizeRow title="Heads (H)" face="H" />
      <SizeRow title="Tails (T)" face="T" />
      <CoinRow title="Individual Effects" faces={['H', 'T']} effectsList={ALL_EFFECTS} />
      <CoinRow title="Combinations" faces={['H', 'T']} effectsList={COMBOS} />
      <AnimRow />
    </div>
  )
}
