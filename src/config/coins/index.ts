// Coin registry — aggregates the per-coin config files into a
// compiler-enforced Record (every CoinEffectKind must be registered), plus
// the shop catalog and shared helpers. Adding a coin: create config/coins/<kind>.ts
// (a CoinEffectConfig) and register it below.

import type { CoinDef, CoinEffectId, CoinEffectKind, DrawCount } from '@/core/types'
import type { CoinEffectConfig } from '../types'
import { DIFFICULTY } from '@/core/balance'
import { weightCoin } from './weight'
import { headsCoin } from './heads'
import { tailsCoin } from './tails'
import { chaosCoin } from './chaos'
import { echoCoin } from './echo'
import { magneticCoin } from './magnetic'
import { reverseCoin } from './reverse'
import { taxCoin } from './tax'
import { jackpotCoin } from './jackpot'
import { drawCoin } from './draw'

/** The coin registry — one entry per CoinEffectKind (compiler-enforced). */
export const COIN_EFFECTS: Record<CoinEffectKind, CoinEffectConfig> = {
  weight: weightCoin,
  heads: headsCoin,
  tails: tailsCoin,
  chaos: chaosCoin,
  echo: echoCoin,
  magnetic: magneticCoin,
  reverse: reverseCoin,
  tax: taxCoin,
  jackpot: jackpotCoin,
  draw: drawCoin,
}

/** The shop coin catalog (12 entries = 10 single-effect coins + Draw-1/2/3). */
export const COIN_CATALOG: CoinDef[] = Object.entries(COIN_EFFECTS).flatMap(([kind, c]): CoinDef[] =>
  c.params.tiers
    ? (Object.entries(c.params.tiers) as unknown as [DrawCount, number][]).map(
        ([count, price]) => ({ effect: `draw${count}` as CoinEffectId, name: `Draw-${count}`, price }),
      )
    : [{ effect: kind as CoinEffectId, name: c.name, price: c.price ?? 0 }],
)

/** Shop price by catalog id (Draw-N → its tier price). */
export function coinPrice(id: CoinEffectId): number {
  return COIN_CATALOG.find((c) => c.effect === id)?.price ?? 0
}

/** The effect's human blurb (its params formatted). */
export function coinBlurb(kind: CoinEffectKind): string {
  const c = COIN_EFFECTS[kind]
  return c.blurb(c.params)
}

/** m13a: the starter collection's Weight coins (the rest are plain 50/50). */
export const STARTER_WEIGHT_COINS = 3 * DIFFICULTY
