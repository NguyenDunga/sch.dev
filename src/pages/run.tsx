// Placeholder — Run screen (SDD Component C6; WBS M12.2 UI).
// TODO: blind header, 8-coin hand area (face-down coins with effect badges),
// 5 play slots, unlimited discard affordance, toss animation, Echo re-flip,
// explicit Score button, charm bar, chips×mult ticker.
// Reads RunState; dispatches the M4 hand-phase store actions
// (drawHand / pickCoin / unpickCoin / discard / confirmPlay / echoReflip / score).
export function RunScreen() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold">Run</h1>
      <p className="text-sm text-muted-foreground">
        Placeholder — the 5-phase hand UI (draw → play → toss → buff → score) lands in M12.
      </p>
    </main>
  )
}
