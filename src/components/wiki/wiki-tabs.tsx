// Wiki tab registry — the single place to add a new wiki tab: one entry here
// + one content component. The dialog renders the tabs in array order. The
// tab contents are data-driven (balance tables / info registries), so new
// effects, charms, tiers, and boss rules appear without tab changes.

import type { ComponentType } from 'react'
import { FaListOl, FaCoins, FaHand, FaSkull } from 'react-icons/fa6'
import { withIcon, type IconProps } from '@/components/ui/icon'
import { PatternsTab } from './tabs/patterns-tab'
import { CoinsTab } from './tabs/coins-tab'
import { CharmsTab } from './tabs/charms-tab'
import { BossesTab } from './tabs/bosses-tab'

export interface WikiTab {
  id: string
  label: string
  icon: ComponentType<IconProps>
  content: ComponentType
}

export const WIKI_TABS: WikiTab[] = [
  { id: 'patterns', label: 'Patterns', icon: withIcon(FaListOl), content: PatternsTab },
  { id: 'coins', label: 'Coins', icon: withIcon(FaCoins), content: CoinsTab },
  { id: 'charms', label: 'Charms', icon: withIcon(FaHand), content: CharmsTab },
  { id: 'bosses', label: 'Bosses', icon: withIcon(FaSkull), content: BossesTab },
]
