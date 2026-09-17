import type { CoinVisualModifier } from '../coin-types'
import { resolveTax } from './tax-config'
export function taxResolver(): CoinVisualModifier {
  return resolveTax()
}
