// Echo — re-flip once during the buff phase (tap the tossed coin).

import { FaRepeat, FaArrowsRotate, FaRotateRight } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const echoCoin: CoinEffectConfig = {
  name: 'Echo',
  blurb: () => 'Re-flip once during the buff phase (tap the tossed coin)',
  icon: { icon: withIcon(FaRepeat), label: 'Echo (re-toss once)', short: 'Echo' },
  face: {
    H: { icon: withIcon(FaRepeat), color: '#f5c878' },
    T: { icon: withIcon(FaArrowsRotate), color: '#8dabd5' },
    facedown: { icon: withIcon(FaRotateRight), color: '#a59c93' },
  },
  params: {},
  price: 7,
}
