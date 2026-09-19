// Wiki dialog — the "?" help dialog: a tabbed reference (patterns / coins /
// charms / bosses; the tab set is the WIKI_TABS registry). Esc, the ×, or
// the overlay closes it. Focus moves to the close button on open.

import { useEffect, useRef, useState } from 'react'
import { WIKI_TABS } from './wiki-tabs'

export function WikiDialog({ onClose }: { onClose: () => void }) {
  const [tabId, setTabId] = useState(WIKI_TABS[0].id)
  const closeRef = useRef<HTMLButtonElement>(null)
  const tab = WIKI_TABS.find((t) => t.id === tabId) ?? WIKI_TABS[0]
  const TabContent = tab.content

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="wiki-overlay" onClick={onClose}>
      <div
        className="wiki-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="50/50 reference"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wiki-head">
          <h2 className="wiki-title">50/50 reference</h2>
          <button ref={closeRef} type="button" className="wiki-close" onClick={onClose} aria-label="Close reference">
            ×
          </button>
        </header>
        <div className="wiki-tabs" role="tablist" aria-label="Reference sections">
          {WIKI_TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tabId}
                className={`wiki-tab${t.id === tabId ? ' wiki-tab--active' : ''}`}
                onClick={() => setTabId(t.id)}
              >
                <Icon size={14} aria-hidden />
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="wiki-body" role="tabpanel">
          <TabContent />
        </div>
      </div>
    </div>
  )
}
