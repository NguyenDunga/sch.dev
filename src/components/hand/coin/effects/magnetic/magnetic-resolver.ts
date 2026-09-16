import type { CoinVisualModifier } from '../../coin-types'
import { resolveMagnetic } from './magnetic-config'
export function magneticResolver(): CoinVisualModifier {
  return resolveMagnetic()
}
