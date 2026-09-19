// Heads — always lands on Heads.

import { FaCircle, FaCircleCheck, FaCircleHalfStroke } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const headsCoin: CoinEffectConfig = {
  name: 'Heads',
  blurb: () => 'Always lands on Heads',
  icon: { icon: withIcon(FaCircle), label: 'Heads (always H)', short: 'Heads' },
  face: {
    H: { icon: withIcon(FaCircleCheck), color: '#d99a2b' },
    T: { icon: withIcon(FaCircle), color: '#5a7aa5' },
    facedown: { icon: withIcon(FaCircleHalfStroke), color: '#7a7168' },
  },
  params: {},
  price: 8,
}
