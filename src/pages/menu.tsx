import { Button } from '@/components/ui/button'
import { useRunStore } from '@/state/runStore'

export function MenuScreen() {
  const startRun = useRunStore((s) => s.startRun)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="font-heading text-5xl font-bold">50/50</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Toss 5 coins. Score the pattern. Clear the blind.
        </p>
      </div>
      <Button size="lg" pulse onClick={() => startRun()}>
        New Run
      </Button>
    </main>
  )
}
