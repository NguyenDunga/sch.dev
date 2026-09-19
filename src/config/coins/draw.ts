// Draw — discarding it redraws coins face-down into empty hand slots.
// Sells in three tiers (Draw-1/2/3) — see params.tiers.

import { FaRotateRight, FaRotateLeft, FaHand, FaCopy } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import type { CoinEffectConfig } from '../types'

export const drawCoin: CoinEffectConfig = {
  name: 'Draw',
  blurb: () => 'Discarding it redraws coins face-down into empty hand slots',
  icon: { icon: withIcon(FaRotateRight), label: 'Draw', short: 'Draw' },
  face: {
    H: { icon: withIcon(FaRotateLeft), color: '#b8860b' },
    T: { icon: withIcon(FaHand), color: '#3a5a85' },
    facedown: { icon: withIcon(FaCopy), color: '#4f463d' },
  },
  params: { tiers: { 1: 5, 2: 8, 3: 12 } },
}
