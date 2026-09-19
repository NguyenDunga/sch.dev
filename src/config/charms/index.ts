// Charm registry — aggregates the per-charm config files into a
// compiler-enforced Record (every CharmId must be registered), plus the
// charm catalog and shared helpers. Adding a charm: create
// config/charms/<id>.ts (a CharmConfig) and register it below.

import type { CharmDef, CharmId } from '@/core/types'
import type { CharmConfig } from '../types'
import { plusChipsCharm } from './plus-chips'
import { plusMultCharm } from './plus-mult'
import { extraHandCharm } from './extra-hand'
import { paydayCharm } from './payday'
import { jackpotFeverCharm } from './jackpot-fever'

/** The charm registry — one entry per CharmId (compiler-enforced). */
export const CHARMS: Record<CharmId, CharmConfig> = {
  plusChips: plusChipsCharm,
  plusMult: plusMultCharm,
  extraHand: extraHandCharm,
  payday: paydayCharm,
  jackpotFever: jackpotFeverCharm,
}

/** The charm catalog (shop offers + the charm bar's names). */
export const CHARM_CATALOG: CharmDef[] = Object.entries(CHARMS).map(
  ([id, c]) => ({ id: id as CharmId, name: c.name, category: c.category, price: c.price }),
)

/** The charm's human blurb (its params formatted). */
export function charmBlurb(id: CharmId): string {
  const c = CHARMS[id]
  return c.blurb(c.params)
}
