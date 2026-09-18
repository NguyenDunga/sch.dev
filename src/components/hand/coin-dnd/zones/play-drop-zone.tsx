// The play row as a drop target (dashed ring while a coin hovers over it).

import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'

export function PlayDropZone({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'play-row' })
  return (
    <div ref={setNodeRef} className={`play-drop-zone${isOver ? ' play-drop-zone--over' : ''}`}>
      {children}
    </div>
  )
}
