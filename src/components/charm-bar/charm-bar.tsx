// Charm bar (C7) — a dnd-kit sortable row of owned charms in scoring order.
// Drag to reorder → moveCharm(from, to) (array order is the charm-bar /
// scoring order). Visible on the run and shop screens. Reads RunState.charms;
// no game logic.

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { CharmId } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { CharmChip } from './charm-chip';

export function CharmBar() {
  const charms = useRunStore((s) => s.charms)
  const moveCharm = useRunStore((s) => s.moveCharm)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  if (charms.length === 0) {
    return (
      <div className="charm-bar charm-bar--empty landscape-short:flex-nowrap landscape-short:overflow-x-auto">No charms yet</div>
    )
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
      <div
        className="charm-bar landscape-short:flex-nowrap landscape-short:overflow-x-auto landscape-short:justify-start"
        role="list"
        aria-label="Charms, in scoring order"
      >
        <SortableContext items={charms} strategy={verticalListSortingStrategy}>
          {charms.map((id) => (
            <CharmChip key={id} id={id} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  )
}
