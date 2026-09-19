// Tax — +cash every time it is played and scored (scaled by difficulty).

import { FaDollarSign, FaMoneyBill, FaCoins } from 'react-icons/fa6'
import { DIFFICULTY } from '@/core/balance'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const taxCoin: CoinEffectConfig = {
  name: 'Tax',
  blurb: (p) => `+$${p.payout} cash every time it is played and scored`,
  icon: { icon: withIcon(FaDollarSign), label: 'Tax', short: 'Tax' },
  face: {
    H: { icon: withIcon(FaDollarSign), color: '#c89018' },
    T: { icon: withIcon(FaMoneyBill), color: '#45658f' },
    facedown: { icon: withIcon(FaCoins), color: '#5a5148' },
  },
  params: { payout: 1 * DIFFICULTY },
  price: 5,
}
