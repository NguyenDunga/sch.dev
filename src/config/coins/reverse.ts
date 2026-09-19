// Reverse — inverts the resolved face after the toss.

import { FaArrowsRotate, FaArrowsLeftRight, FaLeftRight, FaArrowsTurnToDots } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const reverseCoin: CoinEffectConfig = {
  name: 'Reverse',
  blurb: () => 'Inverts the resolved face after the toss',
  icon: { icon: withIcon(FaArrowsRotate), label: 'Reverse', short: 'Reverse' },
  face: {
    H: { icon: withIcon(FaArrowsLeftRight), color: '#e8a838' },
    T: { icon: withIcon(FaLeftRight), color: '#7090ba' },
    facedown: { icon: withIcon(FaArrowsTurnToDots), color: '#8f867d' },
  },
  params: {},
  price: 5,
}
