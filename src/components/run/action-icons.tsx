// Action / HUD / pile icons — the named-action icon map (confirm, score,
// re-roll, leave, hand size, cash, target, reward, draw pile, discard pile).
// The single source of truth for the run HUD + action bar glyphs. Built on
// `react-icons` (Font Awesome 6 = `fa6`).

import {
  FaCheck,
  FaWandMagicSparkles,
  FaDice,
  FaRightFromBracket,
  FaHand,
  FaWallet,
  FaBullseye,
  FaGem,
  FaLayerGroup,
  FaTrash,
} from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'

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
