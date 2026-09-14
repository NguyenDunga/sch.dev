import { Button } from '@/components/ui/button'
import { BLINDS } from '@/core/balance'
import { useRunStore } from '@/state/runStore'

const BLIND_NAMES = { small: 'Small', big: 'Big', boss: 'Boss' } as const

/** C9 — run-end screen. M3.1: the run ends at blind 12 (win) or on a missed blind (lose). */
export function RunEndScreen() {
  const seed = useRunStore((s) => s.seed)
  const won = useRunStore((s) => s.won)
  const blindIndex = useRunStore((s) => s.blindIndex)
  const blindScore = useRunStore((s) => s.blindScore)
  const toMenu = useRunStore((s) => s.toMenu)
  const newRun = useRunStore((s) => s.newRun)

  const blind = BLINDS[blindIndex]

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold">
          {won ? 'Run complete!' : 'Game over'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {won
            ? `All 12 blinds cleared · final ${blindScore} / ${blind.target}`
            : `Round ${blind.round} · ${BLIND_NAMES[blind.kind]} blind · ${blindScore} / ${blind.target}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">seed: {seed}</p>
      </div>
      <div className="flex gap-3">
        <Button size="lg" pulse onClick={() => newRun()}>
          New Run
        </Button>
        <Button variant="ghost" size="lg" onClick={toMenu}>
          Menu
        </Button>
      </div>
    </main>
  )
}
