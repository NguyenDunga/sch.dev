import { useRunStore } from '@/state/runStore'
import { MenuScreen } from '@/pages/menu'
import { RunScreen } from '@/pages/run'
import { ShopScreen } from '@/pages/shop'
import { RunEndScreen } from '@/pages/run-end'

function Screens() {
  const phase = useRunStore((s) => s.phase)
  if (phase === 'run') return <RunScreen />
  if (phase === 'shop') return <ShopScreen />
  if (phase === 'runEnd') return <RunEndScreen />
  return <MenuScreen />
}

export default function App() {
  return <Screens />
}
