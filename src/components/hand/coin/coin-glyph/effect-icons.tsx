// Coin effect icons — the per-effect badges plus the per-effect, per-face-stage
// glyph + color tables (M19). The single source of truth for how a coin's
// effects are drawn. Built on `react-icons` (Font Awesome 6 = `fa6` + a couple
// of `gi` glyphs).

import type { ComponentType } from 'react'
import {
  FaRegFaceGrinWink,
  FaWeightHanging,
  FaCircleCheck,
  FaCircle,
  FaCircleHalfStroke,
  FaCircleDot,
  FaCircleXmark,
  FaCircleMinus,
  FaShuffle,
  FaDice,
  FaDiceD6,
  FaRepeat,
  FaArrowsRotate,
  FaRotateRight,
  FaMagnet,
  FaArrowLeft,
  FaHandPointLeft,
  FaArrowsLeftRight,
  FaLeftRight,
  FaArrowsTurnToDots,
  FaDollarSign,
  FaMoneyBill,
  FaCoins,
  FaUsers,
  FaUserGroup,
  FaPeopleGroup,
  FaRotateLeft,
  FaHand,
  FaCopy,
  FaScaleUnbalancedFlip,
} from 'react-icons/fa6'
import { GiWhaleTail } from 'react-icons/gi'
import type { Face, CoinEffectKind } from '@/core/types'
import { withIcon, type IconDef, type IconProps, type EffectFaceConfig } from '@/components/ui/icon'

// Per-effect, per-face-stage glyph + color (M19). Each effect carries 3
// completely different icons (one per face stage H / T / face-down) and 3
// colors — per-effect tints of the face-stage tones (H = gold, T = slate,
// face-down = gray). 11 effects × 3 face stages = 33 glyphs + 33 color slots.
export const EFFECT_FACE_CONFIGS: Record<CoinEffectKind, EffectFaceConfig> = {
  weight: {
    H: { icon: withIcon(FaRegFaceGrinWink), color: '#e8b04b' },
    T: { icon: withIcon(GiWhaleTail), color: '#6c8cb5' },
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
    facedown: { icon: withIcon(FaCopy), color: '#4f463d' },
  },
}

/**
 * Weight face-down glyphs (by favoured face): the scale tips toward the
 * favoured side — a hint of which face the coin favors while face-down.
 * Weight is the only effect whose face-down glyph depends on a parameter
 * (its `favored` face).
 */
export const WEIGHT_FACEDOWN: Record<Face, { icon: ComponentType<IconProps>; color: string }> = {
  H: { icon: withIcon(FaScaleUnbalancedFlip), color: '#8a8178' },
  T: { icon: withIcon(GiWhaleTail), color: '#8a8178' },
}

// Coin effect badges.
export const EFFECT_ICONS: Record<CoinEffectKind, IconDef> = {
  weight: { icon: withIcon(FaRegFaceGrinWink), label: 'Weight (75/25)', short: 'Weight' },
  heads: { icon: withIcon(FaCircle), label: 'Heads (always H)', short: 'Heads' },
  tails: { icon: withIcon(FaCircleDot), label: 'Tails (always T)', short: 'Tails' },
  chaos: { icon: withIcon(FaShuffle), label: 'Chaos', short: 'Chaos' },
  echo: { icon: withIcon(FaRepeat), label: 'Echo (re-toss once)', short: 'Echo' },
  magnetic: { icon: withIcon(FaMagnet), label: 'Magnetic', short: 'Magnetic' },
  reverse: { icon: withIcon(FaArrowsRotate), label: 'Reverse', short: 'Reverse' },
  tax: { icon: withIcon(FaDollarSign), label: 'Tax', short: 'Tax' },
  jackpot: { icon: withIcon(FaUsers), label: 'Jackpot coin', short: 'Jackpot' },
  draw: { icon: withIcon(FaRotateRight), label: 'Draw', short: 'Draw' },
}
