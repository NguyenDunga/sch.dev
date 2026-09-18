// Tier icons — the single source of truth for how each scoring tier is drawn
// (used by the scoring choreography banner). Built on `react-icons`
// (Font Awesome 6 = `fa6`).

import { FaCircle, FaArrowTrendUp, FaSquare, FaArrowsLeftRight, FaGripLines, FaStar } from 'react-icons/fa6'
import type { TierId } from '@/core/types'
import { withIcon, type IconDef } from '@/components/ui/icon'

export const TIER_ICONS: Record<TierId, IconDef> = {
  threeSame: { icon: withIcon(FaCircle), label: 'Three of a Kind' },
  tripleRun: { icon: withIcon(FaArrowTrendUp), label: 'Triple Run' },
  fourSame: { icon: withIcon(FaSquare), label: 'Four of a Kind' },
  alternating: { icon: withIcon(FaArrowsLeftRight), label: 'Alternating' },
  fourRow: { icon: withIcon(FaGripLines), label: 'Four in a Row' },
  jackpot: { icon: withIcon(FaStar), label: 'Jackpot' },
}
