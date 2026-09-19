// Chaos — rolls fresh 0–100% odds on every toss (a pure wildcard).

import { FaShuffle, FaDice, FaDiceD6 } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const chaosCoin: CoinEffectConfig = {
  name: 'Chaos',
  blurb: () => 'Rolls fresh 0–100% odds on every toss — a pure wildcard',
  icon: { icon: withIcon(FaShuffle), label: 'Chaos', short: 'Chaos' },
  face: {
    H: { icon: withIcon(FaShuffle), color: '#e0a030' },
    T: { icon: withIcon(FaDice), color: '#6888b0' },
    facedown: { icon: withIcon(FaDiceD6), color: '#857c73' },
  },
  params: {},
  price: 6,
}
