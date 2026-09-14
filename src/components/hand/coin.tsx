import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { CoinEffectId, Face } from '@/core/types'

/** One coin flip duration (ms). */
const COIN_FLIP_MS = 550
/** Stagger between coins (ms) so the hand lands left-to-right. */
const COIN_STAGGER_MS = 40

/** Short badge labels for coin effects (shown under the coin). */
const EFFECT_LABELS: Record<CoinEffectId, string> = {
  weight: 'W',
  doubleSide: 'DS',
  chaos: 'C',
  echo: 'E',
  magnetic: 'M',
  reverse: 'R',
  tax: '$',
  jackpot: 'J',
  draw1: '↻1',
  draw2: '↻2',
  draw3: '↻3',
}

/**
 * A single coin. Two faces (heads front, tails back) stacked back-to-back;
 * the coin always spins forward, so a repeated face is a full 360° spin and
 * a changed face is a half flip. Face art lives entirely in the
 * `.coin-face--heads` / `.coin-face--tails` classes (see coin.css) so the
 * polish milestone can swap in real art without touching this component.
 *
 * The coin is tappable in two ways: idle (toss — draw from the deck) and
 * tossed (discard the coin, or re-flip it once when it is an unused Echo).
 */
export function Coin({
  face,
  effects,
  echoAvailable,
  tosses,
  index,
  tappable,
  onTap,
}: {
  face: Face | null
  /** The coin's permanent effects (empty for plain coins). */
  effects: CoinEffectId[]
  /** true when this Echo coin may still be re-flipped this hand. */
  echoAvailable: boolean
  /** How many times this slot has been tossed (initial toss + re-flips + redraws). */
  tosses: number
  index: number
  /** true when the slot can be tapped (toss when idle, discard/re-flip when tossed). */
  tappable: boolean
  onTap: () => void
}) {
  // The coin mounts mid-toss (the store sets the face + toss count together),
  // so it starts with one spin already in flight. Each re-flip/redraw adds a spin.
  const [spins, setSpins] = useState(tosses)
  const prevTosses = useRef(tosses)

  useEffect(() => {
    if (tosses > prevTosses.current) setSpins((s) => s + (tosses - prevTosses.current))
    prevTosses.current = tosses
  }, [tosses])

  const badges =
    effects.length > 0 ? (
      <span className="coin-badges">
        {effects.map((e) => (
          <span key={e} className="coin-badge" title={e}>
            {EFFECT_LABELS[e]}
          </span>
        ))}
      </span>
    ) : null

  if (face === null) {
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

  const target = spins * 360 + (face === 'T' ? 180 : 0)
  const inner = (
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
  const label =
    face === 'H' ? 'heads' : 'tails'
  const action = echoAvailable ? 're-flip' : 'discard'

  if (!tappable) {
    return (
      <div className="coin-wrap">
        <div className="coin" role="img" aria-label={label}>
          {inner}
        </div>
        {badges}
      </div>
    )
  }
  return (
    <button
      type="button"
      className="coin-wrap coin--tappable"
      onClick={onTap}
      aria-label={`${action[0].toUpperCase()}${action.slice(1)} coin ${index + 1} (currently ${label})${echoAvailable ? ', echo available' : ''}`}
    >
      <div className="coin">{inner}</div>
      {badges}
    </button>
  )
}
