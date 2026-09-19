// +Mult — adds mult to every scored hand.

import { FaStar } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CharmConfig } from '../types'

export const plusMultCharm: CharmConfig = {
  name: '+Mult',
  category: 'scoring',
  blurb: (p) => `+${p.mult} mult at score`,
  icon: { icon: withIcon(FaStar), label: 'Plus Mult' },
  params: { mult: 1 },
  price: 8,
}
