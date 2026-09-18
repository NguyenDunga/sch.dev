// Charm chip (13c.5) — a single charm in the charm bar. Shows the charm
// icon (13c.5) + the name (a11y). The icon is the primary signal; the name
// is the text alternative (13c.9). Drag to reorder (dnd-kit).

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CHARMS } from '@/core/balance'
import { CHARM_ICONS } from './charm-icons'
import type { CharmId } from '@/core/types'

export function CharmChip({ id }: { id: CharmId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const def = CHARMS.find((c) => c.id === id)
  const iconDef = CHARM_ICONS[id]
  const Icon = iconDef.icon

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
      <Icon size={18} strokeWidth={2} aria-hidden className="charm-chip-icon" />
      <span className="charm-chip-name">{def?.name ?? id}</span>
    </button>
  )
}
