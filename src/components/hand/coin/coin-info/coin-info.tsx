// Coin info — hover any coin (hand / play row / deck / discard pile / shop
// offer) for a moment to see what each effect on it does. The provider (app
// root) renders one floating panel (portal, anchored above the coin, clamped
// to the viewport). Leaving the coin hides it (a grace lets the pointer reach
// the panel; hovering the panel keeps it open). Esc, an outside click, or the
// × closes it.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { InfoRow } from '@/lib/effect-info'
import { CoinInfoContext, HIDE_GRACE_MS, type CoinInfoAnchor, type CoinInfoContextValue } from './coin-info-context'
import './coin-info.css'

interface CoinInfoState {
  rows: InfoRow[]
  title: string
  anchor: CoinInfoAnchor
}

/** The provider (app root): holds the open panel state + renders the portal. */
export function CoinInfoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<CoinInfoState | null>(null)
  const panelHover = useRef(false)
  const hideTimer = useRef<number | null>(null)

  const clearHide = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const show = useCallback((rows: InfoRow[], title: string, anchor: CoinInfoAnchor) => {
    clearHide()
    setInfo({ rows, title, anchor })
  }, [])

  const scheduleHide = useCallback(() => {
    clearHide()
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null
      if (!panelHover.current) setInfo(null)
    }, HIDE_GRACE_MS)
  }, [])

  const value: CoinInfoContextValue = { show, scheduleHide }

  useEffect(() => {
    if (!info) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfo(null)
    }
    const onDown = (e: MouseEvent) => {
      const panel = document.querySelector('.coin-info')
      if (panel && !panel.contains(e.target as Node)) setInfo(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [info])

  return (
    <CoinInfoContext.Provider value={value}>
      {children}
      {info &&
        createPortal(
          <CoinInfoPanel
            rows={info.rows}
            title={info.title}
            anchor={info.anchor}
            onClose={() => setInfo(null)}
            onPanelEnter={() => {
              panelHover.current = true
              clearHide()
            }}
            onPanelLeave={() => {
              panelHover.current = false
              setInfo(null)
            }}
          />,
          document.body,
        )}
    </CoinInfoContext.Provider>
  )
}

/** The floating panel: one row per effect (icon + name + blurb). Anchored
 *  above the coin (below it when there's no room up top). */
function CoinInfoPanel({
  rows,
  title,
  anchor,
  onClose,
  onPanelEnter,
  onPanelLeave,
}: {
  rows: InfoRow[]
  title: string
  anchor: CoinInfoAnchor
  onClose: () => void
  onPanelEnter: () => void
  onPanelLeave: () => void
}) {
  const PANEL_W = 280
  const centerX = anchor.left + anchor.width / 2
  const above = anchor.top > 280
  const left = Math.max(8, Math.min(centerX - PANEL_W / 2, window.innerWidth - PANEL_W - 8))
  const top = above ? anchor.top - 8 : anchor.bottom + 8
  return (
    <div
      className="coin-info"
      role="dialog"
      aria-label={title}
      style={{ left, top, ...(above ? { transform: 'translateY(-100%)' } : {}) }}
      onMouseEnter={onPanelEnter}
      onMouseLeave={onPanelLeave}
    >
      <header className="coin-info-head">
        <h2 className="coin-info-title">{title}</h2>
        <button type="button" className="coin-info-close" onClick={onClose} aria-label="Close coin info">
          ×
        </button>
      </header>
      {rows.length === 0 ? (
        <p className="coin-info-plain">Plain 50/50 coin — lands Heads or Tails, 50/50.</p>
      ) : (
        <ul className="coin-info-list">
          {rows.map((row, i) => {
            const Icon = row.icon
            return (
              <li key={i} className="coin-info-item">
                <Icon size={16} aria-hidden className="coin-info-icon" />
                <div>
                  <p className="coin-info-name">{row.name}</p>
                  <p className="coin-info-blurb">{row.blurb}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
