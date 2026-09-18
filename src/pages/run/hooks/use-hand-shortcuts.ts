// 13a.5 — the keyboard shortcut set (locked 2026-09-15): number keys 1–9/
// 0 pick the nth hand coin, Ctrl/Cmd+A selects all, Enter confirms, Space
//  scores, Esc clears the selection. Buttons keep their native Enter/Space
//  semantics — the shortcuts only fire when focus is off a control.

import { useEffect } from 'react'
import { isFilled } from '@/core/helpers'
import type { Hand, HandPhase, Play } from '@/core/types'
import type { CoinSelection } from '@/components/hand/coin-dnd'

export function useHandShortcuts(
  hand: Hand,
  play: Play,
  handPhase: HandPhase,
  selection: CoinSelection,
  pickOne: (i: number) => void,
  onConfirm: () => void,
  onScore: () => void,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const onControl = !!target?.closest?.('button, a, input, textarea, select')
      if (e.key === 'Escape') {
        selection.clear()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        if (handPhase === 'play') {
          e.preventDefault() // not the browser select-all
          selection.selectAll(hand)
        }
        return
      }
      if (onControl) return // buttons keep their native Enter/Space
      if (handPhase === 'play') {
        const n = e.key === '0' ? 10 : Number(e.key)
        if (Number.isInteger(n) && n >= 1 && n <= hand.length) {
          e.preventDefault()
          // Ctrl/Cmd+number = the keyboard Ctrl+click (toggle the selection).
          if (e.ctrlKey || e.metaKey) selection.toggle(n - 1)
          else pickOne(n - 1)
          return
        }
        if (e.key === 'Enter' && play.some(isFilled)) {
          e.preventDefault()
          onConfirm()
        }
        return
      }
      if (handPhase === 'buff' && e.key === ' ' && play.some(isFilled)) {
        e.preventDefault() // no page scroll
        onScore()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hand, play, handPhase, selection, pickOne, onConfirm, onScore])
}
