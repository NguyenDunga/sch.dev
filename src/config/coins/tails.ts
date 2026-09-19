// Tails — always lands on Tails.

import { FaCircleDot, FaCircleXmark, FaCircleMinus } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const tailsCoin: CoinEffectConfig = {
  name: 'Tails',
  blurb: () => 'Always lands on Tails',
  icon: { icon: withIcon(FaCircleDot), label: 'Tails (always T)', short: 'Tails' },
  face: {
    H: { icon: withIcon(FaCircleDot), color: '#f0c060' },
    T: { icon: withIcon(FaCircleXmark), color: '#7d9cc5' },
    facedown: { icon: withIcon(FaCircleMinus), color: '#9a9188' },
  },
  params: {},
  price: 8,
}
