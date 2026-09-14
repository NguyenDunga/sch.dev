// Charm bar (C7) — a dnd-kit sortable row of owned charms in scoring order.
// Drag to reorder → moveCharm(from, to) (array order is the charm-bar /
// scoring order). Visible on the run and shop screens. Reads RunState.charms;
// no game logic.

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CHARMS } from '@/core/balance'
import type { CharmId } from '@/core/types'
import { useRunStore } from '@/state/runStore'

function CharmChip({ id }: { id: CharmId }) {
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

export function CharmBar() {
  const charms = useRunStore((s) => s.charms)
  const moveCharm = useRunStore((s) => s.moveCharm)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  if (charms.length === 0) {
    return <div className="charm-bar charm-bar--empty">No charms yet</div>
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = charms.indexOf(active.id as CharmId)
    const to = charms.indexOf(over.id as CharmId)
    if (from !== -1 && to !== -1) moveCharm(from, to)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="charm-bar" role="list" aria-label="Charms, in scoring order">
        <SortableContext items={charms} strategy={verticalListSortingStrategy}>
          {charms.map((id) => (
            <CharmChip key={id} id={id} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}
