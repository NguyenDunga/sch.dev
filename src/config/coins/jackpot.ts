// Jackpot — a chance of +cash every time it is played and scored.

import { FaUsers, FaUserGroup, FaPeopleGroup } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

const pct = (x: number): string => `${Math.round(x * 100)}%`

export const jackpotCoin: CoinEffectConfig = {
  name: 'Jackpot',
  blurb: (p) => `${pct(p.chance ?? 0)} chance of +$${p.payout} cash every time it is played and scored`,
  icon: { icon: withIcon(FaUsers), label: 'Jackpot coin', short: 'Jackpot' },
  face: {
    H: { icon: withIcon(FaUsers), color: '#ffd700' },
    T: { icon: withIcon(FaUserGroup), color: '#90b0d0' },
    facedown: { icon: withIcon(FaPeopleGroup), color: '#b0a79e' },
  },
  params: { chance: 0.25, payout: 4 },
  price: 10,
}
