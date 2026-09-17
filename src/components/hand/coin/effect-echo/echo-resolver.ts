import type { CoinVisualModifier } from '../coin-types'
import { resolveEcho } from './echo-config'
export function echoResolver(): CoinVisualModifier {
  return resolveEcho()
}
