// Effect info — parameter-aware display names + blurbs for coin effects,
// built on the central coin registry (src/config/coins). The data (names,
// blurbs, icons, prices) lives in the per-coin config files; this module
// only shapes it for a REAL coin (Weight's favoured face, Draw's count).

import type { ComponentType } from 'react'
import type { IconProps } from '@/components/ui/icon'
import { COIN_EFFECTS, coinBlurb } from '@/config/coins'
import { CHARMS, charmBlurb } from '@/config/charms'
import type { CharmId, CoinEffect, CoinEffectId, CoinEffectKind, DrawCount } from '@/core/types'

/** Parameter-aware display name (Weight → its favoured face, Draw → its count). */
export function effectDisplayName(effect: CoinEffect): string {
  if (effect.kind === 'weight') {
    const p = COIN_EFFECTS.weight.params
    const hi = Math.round((p.odds ?? 0.75) * 100)
    return `Weight (${effect.favored === 'H' ? 'Heads' : 'Tails'} ${hi}/${100 - hi})`
  }
  if (effect.kind === 'draw') return `Draw-${effect.count}`
  return COIN_EFFECTS[effect.kind].name
}

/** Parameter-aware blurb (Draw → its count). */
export function effectBlurb(effect: CoinEffect): string {
  if (effect.kind === 'draw') {
    return `Discarding it redraws ${effect.count} coin${effect.count > 1 ? 's' : ''} face-down into empty hand slots`
  }
  return coinBlurb(effect.kind)
}

/** One row of the coin-info popover / wiki coin list. */
export interface EffectEntry {
  kind: CoinEffectKind
  name: string
  blurb: string
}

/** Popover rows for a real coin (parameter-aware: Weight's face, Draw's count). */
export function effectEntries(effects: CoinEffect[]): EffectEntry[] {
  return effects.map((e) => ({ kind: e.kind, name: effectDisplayName(e), blurb: effectBlurb(e) }))
}

/** Popover row for a shop-catalog id (Draw-N → its count; Weight → generic,
 *  its favoured face is rolled at purchase). */
export function catalogEntry(id: CoinEffectId): EffectEntry {
  if (id.startsWith('draw')) {
    const count = Number(id.slice(4)) as DrawCount
    return { kind: 'draw', name: `Draw-${count}`, blurb: effectBlurb({ kind: 'draw', count }) }
  }
  const kind = id as CoinEffectKind
  return { kind, name: COIN_EFFECTS[kind].name, blurb: coinBlurb(kind) }
}

// ── Info rows (icon + name + blurb) — the hover panel's generic row type ─────
// A row carries its icon (resolved from the config) so the panel renders coins,
// charms, and hand-size offers the same way — no per-kind lookup in the panel.

export interface InfoRow {
  icon: ComponentType<IconProps>
  name: string
  blurb: string
}

/** One row per real coin effect (icon resolved from the config). */
export function effectRows(effects: CoinEffect[]): InfoRow[] {
  return effects.map((e) => ({
    icon: COIN_EFFECTS[e.kind].icon.icon,
    name: effectDisplayName(e),
    blurb: effectBlurb(e),
  }))
}

/** One row for a shop-catalog coin (weight → generic; draw-N → the tier). */
export function catalogRow(id: CoinEffectId): InfoRow {
  const entry = catalogEntry(id)
  return { icon: COIN_EFFECTS[entry.kind].icon.icon, name: entry.name, blurb: entry.blurb }
}

/** One row for a charm (its icon + name + blurb). */
export function charmRows(id: CharmId): InfoRow[] {
  const c = CHARMS[id]
  return [{ icon: c.icon.icon, name: c.name, blurb: charmBlurb(id) }]
}
