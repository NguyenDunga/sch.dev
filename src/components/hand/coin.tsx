import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { isFilled } from '@/core/helpers'
import type { CoinEffect, CoinEffectKind, Face, HandSlot } from '@/core/types'

/** One coin flip duration (ms). */
const COIN_FLIP_MS = 550
/** Stagger between coins (ms) so the hand lands left-to-right. */
const COIN_STAGGER_MS = 40

/** Short badge labels for coin effects (shown under the coin). */
const EFFECT_LABELS: Record<CoinEffectKind, string> = {
  weight: 'W',
  doubleSide: 'DS',
  chaos: 'C',
  echo: 'E',
  magnetic: 'M',
  reverse: 'R',
  tax: '$',
  jackpot: 'J',
  draw: '↻',
}

/** Badge text for one effect (Draw shows its tier). */
function effectLabel(effect: CoinEffect): string {
  return effect.kind === 'draw' ? `↻${effect.count}` : EFFECT_LABELS[effect.kind]
}

/** Effect badges under a tossed coin (Draw shows its tier). */
function CoinBadges({ effects }: { effects: CoinEffect[] }) {
  if (effects.length === 0) return null
  return (
    <span className="coin-badges">
      {effects.map((e) => (
        <span key={e.kind} className="coin-badge" title={e.kind}>
          {effectLabel(e)}
        </span>
      ))}
    </span>
  )
}

/**
 * The spinning two-face coin (heads front, tails back). The coin always spins
 * forward, so a repeated face is a full 360° spin and a changed face is a half
 * flip. Face art lives entirely in the `.coin-face--heads` / `.coin-face--tails`
 * classes (see coin.css) so the polish milestone can swap in real art without
 * touching this component.
 */
function SpinningCoin({ face, spins, index }: { face: Face; spins: number; index: number }) {
  const target = spins * 360 + (face === 'T' ? 180 : 0)
  return (
    <motion.div
      className="coin-inner"
      initial={{ rotateY: 0 }}
      animate={{ rotateY: target }}
      transition={{
        duration: COIN_FLIP_MS / 1000,
        delay: (index * COIN_STAGGER_MS) / 1000,
        ease: [0.3, 0.1, 0.3, 1],
      }}
    >
      <div className="coin-face coin-face--heads">H</div>
      <div className="coin-face coin-face--tails">T</div>
    </motion.div>
  )
}

interface CoinProps {
  /** The hand slot this coin renders: empty (idle) or filled with a tossed coin. */
  slot: HandSlot
  /** true when this Echo coin may still be re-flipped this hand. */
  echoAvailable: boolean
  /** How many times this slot has been tossed (initial toss + re-flips + redraws). */
  tosses: number
  index: number
  /** true when the slot can be tapped (toss when idle, discard/re-flip when tossed). */
  tappable: boolean
  onTap: () => void
}

/**
 * A single coin. Idle: a tappable face-down slot (toss — draw from the deck).
 * Tossed: the resolved face with effect badges; tappable to discard (or
 * re-flip once when it is an unused Echo).
 */
export function Coin({ slot, echoAvailable, tosses, index, tappable, onTap }: CoinProps) {
  // The coin mounts mid-toss (the store sets the face + toss count together),
  // so it starts with one spin already in flight. Each re-flip/redraw adds a spin.
  const [spins, setSpins] = useState(tosses)
  const prevTosses = useRef(tosses)

  useEffect(() => {
    if (tosses > prevTosses.current) setSpins((s) => s + (tosses - prevTosses.current))
    prevTosses.current = tosses
  }, [tosses])

  if (!isFilled(slot)) {
    if (!tappable) return <div className="coin coin--idle" aria-hidden />
    return (
      <button
        type="button"
        className="coin coin--idle coin--tappable"
        onClick={onTap}
        aria-label={`Toss coin ${index + 1}`}
      />
    )
  }

  const { face, coin } = slot
  const label = face === 'H' ? 'heads' : 'tails'
  const inner = <SpinningCoin face={face} spins={spins} index={index} />

  if (!tappable) {
    return (
      <div className="coin-wrap">
        <div className="coin" role="img" aria-label={label}>
          {inner}
        </div>
        <CoinBadges effects={coin.effects} />
      </div>
    )
  }

  const action = echoAvailable ? 'Re-flip' : 'Discard'
  return (
    <button
      type="button"
      className="coin-wrap coin--tappable"
      onClick={onTap}
      aria-label={`${action} coin ${index + 1} (currently ${label})${echoAvailable ? ', echo available' : ''}`}
    >
      <div className="coin">{inner}</div>
      <CoinBadges effects={coin.effects} />
    </button>
  )
}
