// Wiki dialog — the "?" help dialog: a tabbed reference (patterns / coins /
// charms / bosses; the tab set is the WIKI_TABS registry). Esc, the ×, or
// the overlay closes it. Focus moves to the close button on open.
//
// M23.7b — responsive chrome via the shadcn Dialog primitive: a centered
// panel on md+ and a full-height bottom sheet on phone. The responsive
// split lives in ui/dialog.tsx (one DialogContent), so there is no second
// dialog component to keep in sync. The content (head / tabs / body) is
// unchanged.

import { useEffect, useRef, useState } from 'react'
import { WIKI_TABS } from './wiki-tabs'
import { Dialog, DialogContent } from '@/components/ui/dialog'

/** The tabbed reference content (chrome-agnostic — the shell is the
 *  unified DialogContent: bottom sheet on phone, centered panel on md+). */
function WikiContent({ onClose }: { onClose: () => void }) {
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
    <div
      className="wiki-dialog h-full w-full md:h-auto md:w-[560px] md:max-h-[min(720px,calc(100dvh-var(--sp-8)))] md:max-w-full"
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
  )
}

export function WikiDialog({ onClose }: { onClose: () => void }) {
  const onOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="wiki-dialog-shell gap-0 p-0"
        overlayClassName="wiki-overlay"
        onOverlayClick={onClose}
        showCloseButton={false}
        aria-label="50/50 reference"
      >
        <WikiContent onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
