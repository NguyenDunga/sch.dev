// Central icon registry (13c.2) — the single source of truth for every icon
// on the board. Exhaustive `Record`s keyed by `Face`, `CoinEffectKind`,
// `CharmId`, `TierId`, plus a named-action map. Each `IconDef` carries the
// icon component, a required `label` (a11y text — 13c.9), and an optional
// color token (the colorblind-safe secondary signal — 13c.9).
//
// Custom game-specific SVGs live in `src/components/icons/`; generic icons
// come from `lucide-react` (13c.1).

import type { ComponentType } from 'react'
import {
  Shuffle,
  Magnet,
  RotateCcw,
  CircleDollarSign,
  RefreshCw,
  Plus,
  Star,
  Hand,
  Wallet,
  Flame,
  Circle,
  TrendingUp,
  Square,
  ArrowLeftRight,
  Rows,
  Check,
  Sparkles,
  Dice5,
  LogOut,
  Target,
  Gem,
  Layers,
  Trash2,
} from 'lucide-react'
import {
  HeadsIcon,
  TailsIcon,
  FaceDownIcon,
  WeightIcon,
  DoubleSideIcon,
  EchoIcon,
  JackpotIcon,
} from '@/components/icons'
import type { Face, CoinEffectKind, CharmId, TierId } from '@/core/types'

/** A single icon definition: the component + a11y label + optional color. */
export interface IconDef {
  /** The icon component (Lucide or custom). */
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  /** The a11y text (13c.9): every icon keeps a text alternative. */
  label: string
  /** An optional color token (CSS variable) — the colorblind-safe secondary signal. */
  colorToken?: string
}

// -- Coin faces (13c.3) ---------------------------------------------------------

export const FACE_ICONS: Record<Face, IconDef> = {
  H: { icon: HeadsIcon, label: 'Heads', colorToken: 'var(--heads)' },
  T: { icon: TailsIcon, label: 'Tails', colorToken: 'var(--tails)' },
}

/** The face-down (back) coin icon. */
export const FACE_DOWN_ICON: IconDef = { icon: FaceDownIcon, label: 'Face down' }

// -- Coin effect badges (13c.4) -------------------------------------------------

export const EFFECT_ICONS: Record<CoinEffectKind, IconDef> = {
  weight: { icon: WeightIcon, label: 'Weight (75/25)' },
  doubleSide: { icon: DoubleSideIcon, label: 'Double-Side' },
  chaos: { icon: Shuffle, label: 'Chaos' },
  echo: { icon: EchoIcon, label: 'Echo (re-toss once)' },
  magnetic: { icon: Magnet, label: 'Magnetic' },
  reverse: { icon: RotateCcw, label: 'Reverse' },
  tax: { icon: CircleDollarSign, label: 'Tax' },
  jackpot: { icon: JackpotIcon, label: 'Jackpot coin' },
  draw: { icon: RefreshCw, label: 'Draw' },
}

// -- Charms (13c.5) -------------------------------------------------------------

export const CHARM_ICONS: Record<CharmId, IconDef> = {
  plusChips: { icon: Plus, label: 'Plus Chips' },
  plusMult: { icon: Star, label: 'Plus Mult' },
  extraHand: { icon: Hand, label: 'Extra Hand' },
  payday: { icon: Wallet, label: 'Payday' },
  jackpotFever: { icon: Flame, label: 'Jackpot Fever' },
}

// -- Tiers (13c.6) --------------------------------------------------------------

export const TIER_ICONS: Record<TierId, IconDef> = {
  threeSame: { icon: Circle, label: 'Three of a Kind' },
  tripleRun: { icon: TrendingUp, label: 'Triple Run' },
  fourSame: { icon: Square, label: 'Four of a Kind' },
  alternating: { icon: ArrowLeftRight, label: 'Alternating' },
  fourRow: { icon: Rows, label: 'Four in a Row' },
  jackpot: { icon: Star, label: 'Jackpot' },
}

// -- Actions / HUD / piles (13c.7) ----------------------------------------------

export const ACTION_ICONS = {
  confirm: { icon: Check, label: 'Confirm' },
  score: { icon: Sparkles, label: 'Score' },
  reroll: { icon: Dice5, label: 'Re-roll' },
  leave: { icon: LogOut, label: 'Leave' },
  handSize: { icon: Hand, label: 'Hand size' },
  cash: { icon: Wallet, label: 'Cash' },
  target: { icon: Target, label: 'Target' },
  reward: { icon: Gem, label: 'Reward' },
  deck: { icon: Layers, label: 'Draw pile' },
  discard: { icon: Trash2, label: 'Discard pile' },
} as const

export type ActionIconKey = keyof typeof ACTION_ICONS
