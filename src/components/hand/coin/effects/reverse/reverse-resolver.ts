import type { CoinVisualModifier } from '../../coin-types'
import { resolveReverse } from './reverse-config'
export function reverseResolver(): CoinVisualModifier {
  return resolveReverse()
}
