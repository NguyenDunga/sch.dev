// Coin drag & drop module (13a.5 / 13a.6) — public API.
export { CoinDnd, CoinDragOverlay } from './coin-dnd'
export { DraggableHandCoin } from './draggable-hand-coin'
export { PlaySlotDnd } from './play-slot-dnd'
export { PlayDropZone } from './play-drop-zone'
export { DiscardWellDrop } from './discard-well-drop'
export {
  useCoinSelection,
  dropTargets,
  selectedInOrder,
  discardTargets,
  routeDrop,
  type CoinSelection,
  type DropRoute,
} from './logic'
