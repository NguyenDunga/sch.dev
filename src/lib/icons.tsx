// Central icon registry — the single source of truth for every icon on the
// board, built on `react-icons` (Font Awesome 6 = `fa6`). Exhaustive `Record`s
// keyed by `Face`, `CoinEffectKind`, `CharmId`, `TierId`, plus a named-action
// map. Each `IconDef` carries the icon component, a required `label` (a11y
// text), and an optional color token (the colorblind-safe secondary signal).
//
// react-icons are fill-based (no `strokeWidth`), so each icon is wrapped with
// `withIcon` to accept the legacy prop shape (size / strokeWidth / className /
// color / aria-hidden); `strokeWidth` is accepted and ignored.

import type { ComponentType } from 'react'
import {
  FaCircle,
  FaCircleDot,
  FaCircleQuestion,
  FaScaleBalanced,
  FaShuffle,
  FaRepeat,
  FaMagnet,
  FaArrowsRotate,
  FaDollarSign,
  FaUsers,
  FaRotateRight,
  FaPlus,
  FaStar,
  FaHand,
  FaWallet,
  FaFire,
  FaArrowTrendUp,
  FaSquare,
  FaArrowsLeftRight,
  FaGripLines,
  FaCheck,
  FaWandMagicSparkles,
  FaDice,
  FaDiceD6,
  FaRightFromBracket,
  FaBullseye,
  FaGem,
  FaLayerGroup,
  FaTrash,
  FaScaleUnbalanced,
  FaWeightHanging,
  FaCircleCheck,
  FaCircleHalfStroke,
  FaCircleXmark,
  FaCircleMinus,
  FaEye,
  FaEyeSlash,
  FaEyeDropper,
  FaArrowLeft,
  FaHandPointLeft,
  FaLeftRight,
  FaArrowsTurnToDots,
  FaMoneyBill,
  FaCoins,
  FaUserGroup,
  FaPeopleGroup,
  FaRotateLeft,
  FaPencil,
} from 'react-icons/fa6'
import type { Face, CoinEffectKind, CharmId, TierId } from '@/core/types'

/** The prop shape every icon accepts (legacy-compatible). */
export interface IconProps {
  size?: number
  /** Accepted for compatibility; ignored (react-icons are fill-based). */
  strokeWidth?: number
  className?: string
  color?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

/** The prop shape a raw react-icons icon component accepts. */
type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  color?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

/** Wrap a react-icons icon so it accepts the legacy prop shape. */
export function withIcon(IconCmp: IconComponent): ComponentType<IconProps> {
  return function WrappedIcon(props: IconProps) {
    const { size, className, color, 'aria-hidden': ariaHidden } = props
    return <IconCmp size={size} className={className} color={color} aria-hidden={ariaHidden} />
  }
}

/** A single icon definition: the component + a11y label + optional color +
 *  optional short display name (rendered as small text under the icon). */
export interface IconDef {
  icon: ComponentType<IconProps>
  label: string
  colorToken?: string
  /** Short display name (e.g. "Weight" for "Weight (75/25)"). */
  short?: string
}

// -- Coin faces (face states) ---------------------------------------------------

export const FACE_ICONS: Record<Face, IconDef> = {
  H: { icon: withIcon(FaCircle), label: 'Heads', colorToken: 'var(--heads)' },
  T: { icon: withIcon(FaCircleDot), label: 'Tails', colorToken: 'var(--tails)' },
}

/** The face-down (back) coin icon. */
export const FACE_DOWN_ICON: IconDef = { icon: withIcon(FaCircleQuestion), label: 'Face down' }

// -- Per-effect, per-face-stage glyph + color (M19) ----------------------------
//
// Each effect carries 3 completely different icons (one per face stage H / T /
// face-down) and 3 colors — per-effect tints of the face-stage tones
// (H = gold, T = slate, face-down = gray). 11 effects × 3 face stages =
// 33 glyphs + 33 color slots.

export interface EffectFaceConfig {
  H: { icon: ComponentType<IconProps>; color: string }
  T: { icon: ComponentType<IconProps>; color: string }
  facedown: { icon: ComponentType<IconProps>; color: string }
}

export const EFFECT_FACE_CONFIGS: Record<CoinEffectKind, EffectFaceConfig> = {
  weight: {
    H: { icon: withIcon(FaScaleBalanced), color: '#e8b04b' },
    T: { icon: withIcon(FaScaleUnbalanced), color: '#6c8cb5' },
    facedown: { icon: withIcon(FaWeightHanging), color: '#8a8178' },
  },
  heads: {
    H: { icon: withIcon(FaCircleCheck), color: '#d99a2b' },
    T: { icon: withIcon(FaCircle), color: '#5a7aa5' },
    facedown: { icon: withIcon(FaCircleHalfStroke), color: '#7a7168' },
  },
  tails: {
    H: { icon: withIcon(FaCircleDot), color: '#f0c060' },
    T: { icon: withIcon(FaCircleXmark), color: '#7d9cc5' },
    facedown: { icon: withIcon(FaCircleMinus), color: '#9a9188' },
  },
  facedown: {
    H: { icon: withIcon(FaEye), color: '#c98a20' },
    T: { icon: withIcon(FaEyeSlash), color: '#4a6a95' },
    facedown: { icon: withIcon(FaEyeDropper), color: '#6a6158' },
  },
  chaos: {
    H: { icon: withIcon(FaShuffle), color: '#e0a030' },
    T: { icon: withIcon(FaDice), color: '#6888b0' },
    facedown: { icon: withIcon(FaDiceD6), color: '#857c73' },
  },
  echo: {
    H: { icon: withIcon(FaRepeat), color: '#f5c878' },
    T: { icon: withIcon(FaArrowsRotate), color: '#8dabd5' },
    facedown: { icon: withIcon(FaRotateRight), color: '#a59c93' },
  },
  magnetic: {
    H: { icon: withIcon(FaMagnet), color: '#d09028' },
    T: { icon: withIcon(FaArrowLeft), color: '#5575a0' },
    facedown: { icon: withIcon(FaHandPointLeft), color: '#655c53' },
  },
  reverse: {
    H: { icon: withIcon(FaArrowsLeftRight), color: '#e8a838' },
    T: { icon: withIcon(FaLeftRight), color: '#7090ba' },
    facedown: { icon: withIcon(FaArrowsTurnToDots), color: '#8f867d' },
  },
  tax: {
    H: { icon: withIcon(FaDollarSign), color: '#c89018' },
    T: { icon: withIcon(FaMoneyBill), color: '#45658f' },
    facedown: { icon: withIcon(FaCoins), color: '#5a5148' },
  },
  jackpot: {
    H: { icon: withIcon(FaUsers), color: '#ffd700' },
    T: { icon: withIcon(FaUserGroup), color: '#90b0d0' },
    facedown: { icon: withIcon(FaPeopleGroup), color: '#b0a79e' },
  },
  draw: {
    H: { icon: withIcon(FaRotateLeft), color: '#b8860b' },
    T: { icon: withIcon(FaHand), color: '#3a5a85' },
    facedown: { icon: withIcon(FaPencil), color: '#4f463d' },
  },
}

// -- Coin effect badges ----------------------------------------------------------

export const EFFECT_ICONS: Record<CoinEffectKind, IconDef> = {
  weight: { icon: withIcon(FaScaleBalanced), label: 'Weight (75/25)', short: 'Weight' },
  heads: { icon: withIcon(FaCircle), label: 'Heads (always H)', short: 'Heads' },
  tails: { icon: withIcon(FaCircleDot), label: 'Tails (always T)', short: 'Tails' },
  facedown: { icon: withIcon(FaCircleQuestion), label: 'Face-down display', short: 'Face-Down' },
  chaos: { icon: withIcon(FaShuffle), label: 'Chaos', short: 'Chaos' },
  echo: { icon: withIcon(FaRepeat), label: 'Echo (re-toss once)', short: 'Echo' },
  magnetic: { icon: withIcon(FaMagnet), label: 'Magnetic', short: 'Magnetic' },
  reverse: { icon: withIcon(FaArrowsRotate), label: 'Reverse', short: 'Reverse' },
  tax: { icon: withIcon(FaDollarSign), label: 'Tax', short: 'Tax' },
  jackpot: { icon: withIcon(FaUsers), label: 'Jackpot coin', short: 'Jackpot' },
  draw: { icon: withIcon(FaRotateRight), label: 'Draw', short: 'Draw' },
}

// -- Charms ----------------------------------------------------------------------

export const CHARM_ICONS: Record<CharmId, IconDef> = {
  plusChips: { icon: withIcon(FaPlus), label: 'Plus Chips' },
  plusMult: { icon: withIcon(FaStar), label: 'Plus Mult' },
  extraHand: { icon: withIcon(FaHand), label: 'Extra Hand' },
  payday: { icon: withIcon(FaWallet), label: 'Payday' },
  jackpotFever: { icon: withIcon(FaFire), label: 'Jackpot Fever' },
}

// -- Tiers -----------------------------------------------------------------------

export const TIER_ICONS: Record<TierId, IconDef> = {
  threeSame: { icon: withIcon(FaCircle), label: 'Three of a Kind' },
  tripleRun: { icon: withIcon(FaArrowTrendUp), label: 'Triple Run' },
  fourSame: { icon: withIcon(FaSquare), label: 'Four of a Kind' },
  alternating: { icon: withIcon(FaArrowsLeftRight), label: 'Alternating' },
  fourRow: { icon: withIcon(FaGripLines), label: 'Four in a Row' },
  jackpot: { icon: withIcon(FaStar), label: 'Jackpot' },
}

// -- Actions / HUD / piles --------------------------------------------------------

export const ACTION_ICONS = {
  confirm: { icon: withIcon(FaCheck), label: 'Confirm' },
  score: { icon: withIcon(FaWandMagicSparkles), label: 'Score' },
  reroll: { icon: withIcon(FaDice), label: 'Re-roll' },
  leave: { icon: withIcon(FaRightFromBracket), label: 'Leave' },
  handSize: { icon: withIcon(FaHand), label: 'Hand size' },
  cash: { icon: withIcon(FaWallet), label: 'Cash' },
  target: { icon: withIcon(FaBullseye), label: 'Target' },
  reward: { icon: withIcon(FaGem), label: 'Reward' },
  deck: { icon: withIcon(FaLayerGroup), label: 'Draw pile' },
  discard: { icon: withIcon(FaTrash), label: 'Discard pile' },
} as const

export type ActionIconKey = keyof typeof ACTION_ICONS
