// /debug/coin — visual test page for all coin visual code.
//
// Shows every coin state: face-down, H, T, all effects individually,
// and all effect combinations. Desktop-only dev tool.

import { useState } from 'react'
import { Coin } from '@/components/hand/coin'
import { HandCoin } from '@/components/hand/hand-coin/hand-coin'
import { PlaySlot } from '@/components/hand/play-slot/play-slot'
import type { CoinEffect, Face, HandSlot } from '@/core/types'
import { ALL_EFFECTS, COMBOS, SIZES } from './coin-samples'

// ── Page ─────────────────────────────────────────────────────────────────────

function CoinRow({ title, faces, effectsList }: { title: string; faces: (Face | undefined)[]; effectsList: typeof ALL_EFFECTS }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>{title}</h2>
      {faces.map((face) => (
        <div key={face ?? 'back'} style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{face === 'H' ? 'Heads' : face === 'T' ? 'Tails' : 'Face-down'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))', gap: '1rem' }}>
            {effectsList.map(({ label, effects }) => (
              <div key={label} style={{ textAlign: 'center', padding: '0.5rem' }}>
                <Coin face={face} effects={effects} coinId={`${face ?? 'back'}-${label}`} size={56} />
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
      </div>
    </section>
  )
}

/** The pick / unpick flight (12.4): the real HandCoin ↔ PlaySlot shared-layout
 *  animation — click the coin in the hand to pick it into the play slot
 *  (spring-snappy); click it in the slot to unpick it back (spring-soft). */
function PickRow() {
  const [inPlay, setInPlay] = useState(false)
  const coin = { id: 99, effects: [] as CoinEffect[] }
  const slot: HandSlot = { kind: 'filled', coin, face: 'H', echoUsed: false }
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Pick / Unpick (click into play)</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
        The real shared-layout animation (HandCoin ↔ PlaySlot, same coin id): click the coin in
        the hand to pick it into the play slot (spring-snappy); click it in the slot to unpick
        it back (spring-soft).
      </p>
      <div style={{ display: 'flex', gap: '6rem', alignItems: 'flex-end' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '5.5rem', height: '5.5rem', display: 'grid', placeItems: 'center' }}>
            {!inPlay && <HandCoin coin={coin} index={0} enabled shaking={false} shakeKey={0} onPick={() => setInPlay(true)} />}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Hand</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '5.5rem', height: '5.5rem', display: 'grid', placeItems: 'center' }}>
            {inPlay && <PlaySlot index={0} slot={slot} revealed={false} onUnpick={() => setInPlay(false)} />}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)' }}>Play</span>
        </div>
      </div>
    </section>
  )
}

function DetailRow({ title, face, effectsList }: { title: string; face: Face | undefined; effectsList: typeof ALL_EFFECTS }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>{title}</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
        The same 5-layer coins at 120px — the same structure as the rows above, just larger.
        Hover a ring wedge to radially wipe in that effect's glyph; hover the disk to collapse
        back to the default (highest-priority effect).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))', gap: '1.25rem' }}>
        {effectsList.map(({ label, effects }) => (
          <div key={label} style={{ textAlign: 'center', padding: '0.5rem' }}>
            <Coin face={face} effects={effects} coinId={`detail-${face ?? 'back'}-${label}`} size={120} />
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', display: 'block', marginTop: '0.5rem' }}>{label}</span>
          </div>
        ))}
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
      <CoinRow title="Individual Effects" faces={['H', 'T', undefined]} effectsList={ALL_EFFECTS} />
      <CoinRow title="Combinations" faces={['H', 'T', undefined]} effectsList={COMBOS} />
      <DetailRow title="Detail — Face-down" face={undefined} effectsList={COMBOS} />
      <DetailRow title="Detail — Heads (H)" face="H" effectsList={COMBOS} />
      <DetailRow title="Detail — Tails (T)" face="T" effectsList={COMBOS} />
      <PickRow />
      <AnimRow />
    </div>
  )
}
