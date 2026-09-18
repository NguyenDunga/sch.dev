// The portaled fixed layers (13.1 discard ghost + 13.3 choreo): portaled
// to <body> so the fixed layers track viewport coords even while the
// screen-in/out transform is active.

import { createPortal } from 'react-dom'
import type { RefObject } from 'react'
import { DiscardGhostLayer } from '@/components/run/discard-ghost'
import type { DiscardGhost } from '@/components/run/discard-ghost'
import { ScoringChoreography } from '@/components/juice/choreo'
import type { Beat, ChoroSeq } from '@/components/juice/choreo'

export interface RunPortalsProps {
  ghosts: DiscardGhost[]
  removeGhost: (key: number) => void
  /** The choreography view (13.3): the sequence + beat + the flight refs. */
  choro: {
    seq: ChoroSeq | null
    beat: Beat
    reduced: boolean
    chipsRef: RefObject<HTMLSpanElement | null>
    cashRef: RefObject<HTMLSpanElement | null>
  }
}

export function RunPortals({ ghosts, removeGhost, choro }: RunPortalsProps) {
  return (
    <>
      {createPortal(<DiscardGhostLayer ghosts={ghosts} onDone={removeGhost} />, document.body)}
      {createPortal(
        <ScoringChoreography
          seq={choro.seq}
          beat={choro.beat}
          reduced={choro.reduced}
          chipsRef={choro.chipsRef}
          cashRef={choro.cashRef}
        />,
        document.body,
      )}
    </>
  )
}
