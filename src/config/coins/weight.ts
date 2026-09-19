// Weight — the 75/25 coin: lands on its favoured face 75% of the time.

import { FaRegFaceGrinWink, FaWeightHanging } from 'react-icons/fa6'
import { GiWhaleTail } from 'react-icons/gi'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

const pct = (x: number): string => `${Math.round(x * 100)}%`

export const weightCoin: CoinEffectConfig = {
  name: 'Weight',
  blurb: (p) => `${pct(p.odds ?? 0.75)} chance of its favoured face, ${pct(1 - (p.odds ?? 0.75))} the other way`,
  icon: { icon: withIcon(FaRegFaceGrinWink), label: 'Weight (75/25)', short: 'Weight' },
  face: {
    H: { icon: withIcon(FaRegFaceGrinWink), color: '#e8b04b' },
    T: { icon: withIcon(GiWhaleTail), color: '#6c8cb5' },
    facedown: { icon: withIcon(FaWeightHanging), color: '#8a8178' },
  },
  params: { odds: 0.75 },
  price: 5,
  facedownByFavored: {
    H: { icon: withIcon(FaRegFaceGrinWink), color: '#8a8178' },
    T: { icon: withIcon(GiWhaleTail), color: '#8a8178' },
  },
}
