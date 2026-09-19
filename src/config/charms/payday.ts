// Payday — bonus cash on every blind clear (scaled by difficulty).

import { FaWallet } from 'react-icons/fa6'
import { DIFFICULTY } from '@/core/balance'
import { withIcon } from '@/components/ui/icon'
import type { CharmConfig } from '../types'

export const paydayCharm: CharmConfig = {
  name: 'Payday',
  category: 'economy',
  blurb: (p) => `+$${p.bonus} bonus reward when a blind is cleared`,
  icon: { icon: withIcon(FaWallet), label: 'Payday' },
  params: { bonus: 5 * DIFFICULTY },
  price: 5,
}
