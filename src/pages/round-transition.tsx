import { Button } from '@/components/ui/button'
import { BLINDS } from '@/core/balance'
import { useRunStore } from '@/state/runStore'

/** M3.1 — round transition: shown after each boss blind clears, before the next round. */
export function RoundTransitionScreen() {
  const blindIndex = useRunStore((s) => s.blindIndex)
  const continueRun = useRunStore((s) => s.continueRun)

  const next = BLINDS[blindIndex + 1]

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold">Round {next.round}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {BLINDS.length - blindIndex - 1} blinds left — the deck is freshly shuffled
        </p>
      </div>
      <Button size="lg" pulse onClick={continueRun}>
        Continue
      </Button>
    </main>
  )
}
