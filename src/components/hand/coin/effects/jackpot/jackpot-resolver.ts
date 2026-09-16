import type { CoinVisualModifier } from '../../coin-types'
import { resolveJackpot } from './jackpot-config'
export function jackpotResolver(): CoinVisualModifier {
  return resolveJackpot()
}
