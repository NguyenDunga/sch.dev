import { useRunStore } from '@/state/runStore'
import { DebugPage } from '@/pages/debug'
import { MenuScreen } from '@/pages/menu'
import { RunScreen } from '@/pages/run'
import { RunEndScreen } from '@/pages/run-end'
import { RoundTransitionScreen } from '@/pages/round-transition'

function Screens() {
  const phase = useRunStore((s) => s.phase)
  if (phase === 'run') return <RunScreen />
  if (phase === 'runEnd') return <RunEndScreen />
  if (phase === 'roundTransition') return <RoundTransitionScreen />
  return <MenuScreen />
}

export default function App() {
  if (window.location.pathname.startsWith('/debug')) {
    return <DebugPage />
  }
  return <Screens />
}
