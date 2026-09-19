// Extra Hand — one more hand per blind.

import { FaHand } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CharmConfig } from '../types'

export const extraHandCharm: CharmConfig = {
  name: 'Extra Hand',
  category: 'flip',
  blurb: (p) => `+${p.hands} hand per blind`,
  icon: { icon: withIcon(FaHand), label: 'Extra Hand' },
  params: { hands: 1 },
  // 13a.11: $10 → $15 (playtest: +1 of 4 hands ≈ +5–9pp clear rate on mid
  // blinds; the only charm that adds a full hand of EV)
  price: 15,
}
