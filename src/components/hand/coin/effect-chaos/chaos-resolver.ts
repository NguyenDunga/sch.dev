import type { CoinVisualModifier } from '../coin-types'
import { resolveChaos } from './chaos-config'
export function chaosResolver(): CoinVisualModifier {
  return resolveChaos()
}
