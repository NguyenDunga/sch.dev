// Charm icons — the single source of truth for how each charm is drawn.
// Built on `react-icons` (Font Awesome 6 = `fa6`).

import { FaPlus, FaStar, FaHand, FaWallet, FaFire } from 'react-icons/fa6'
import type { CharmId } from '@/core/types'
import { withIcon, type IconDef } from '@/components/ui/icon'

export const CHARM_ICONS: Record<CharmId, IconDef> = {
  plusChips: { icon: withIcon(FaPlus), label: 'Plus Chips' },
  plusMult: { icon: withIcon(FaStar), label: 'Plus Mult' },
  extraHand: { icon: withIcon(FaHand), label: 'Extra Hand' },
  payday: { icon: withIcon(FaWallet), label: 'Payday' },
  jackpotFever: { icon: withIcon(FaFire), label: 'Jackpot Fever' },
}
