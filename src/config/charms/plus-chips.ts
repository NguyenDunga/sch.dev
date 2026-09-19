// +Chips — adds chips to every scored hand.

import { FaPlus } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CharmConfig } from '../types'

export const plusChipsCharm: CharmConfig = {
  name: '+Chips',
  category: 'scoring',
  blurb: (p) => `+${p.chips} chips at score`,
  icon: { icon: withIcon(FaPlus), label: 'Plus Chips' },
  params: { chips: 10 },
  price: 5,
}
