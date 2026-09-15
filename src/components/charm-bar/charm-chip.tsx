
import {  useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CHARMS } from '@/core/balance'
import type { CharmId } from '@/core/types'

export function CharmChip({ id }: { id: CharmId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const def = CHARMS.find((c) => c.id === id)
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`charm-chip charm-chip--${id}${isDragging ? ' charm-chip--dragging' : ''}`}
      {...attributes}
      {...listeners}
      title={`${def?.name ?? id} (${def?.category ?? ''})`}
      aria-label={`${def?.name ?? id}, drag to reorder`}
    >
      {def?.name ?? id}
    </button>
  )
}