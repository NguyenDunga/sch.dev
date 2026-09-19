// Jackpot Fever — multiplies chips on a Jackpot hand.

import { FaFire } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CharmConfig } from '../types'

export const jackpotFeverCharm: CharmConfig = {
  name: 'Jackpot Fever',
  category: 'pattern',
  blurb: (p) => `×${p.chipsMult} chips on a Jackpot hand`,
  icon: { icon: withIcon(FaFire), label: 'Jackpot Fever' },
  params: { chipsMult: 2 },
  price: 12,
}
