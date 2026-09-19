// Magnetic — 75% chance to match the face of the coin to its left.

import { FaMagnet, FaArrowLeft, FaHandPointLeft } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

const pct = (x: number): string => `${Math.round(x * 100)}%`

export const magneticCoin: CoinEffectConfig = {
  name: 'Magnetic',
  blurb: (p) => `${pct(p.odds ?? 0.75)} chance to match the face of the coin to its left`,
  icon: { icon: withIcon(FaMagnet), label: 'Magnetic', short: 'Magnetic' },
  face: {
    H: { icon: withIcon(FaMagnet), color: '#d09028' },
    T: { icon: withIcon(FaArrowLeft), color: '#5575a0' },
    facedown: { icon: withIcon(FaHandPointLeft), color: '#655c53' },
  },
  params: { odds: 0.75 },
  price: 6,
}
