// Wiki button — the shared "?" button (menu / run top bar / shop header)
// that opens the tabbed reference dialog. Self-contained: it owns the open
// state, so a screen just drops <WikiButton /> into its header row.

import { useState } from 'react'
import { FaCircleQuestion } from 'react-icons/fa6'
import { withIcon } from '@/components/ui/icon'
import { WikiDialog } from './wiki-dialog'

const QuestionIcon = withIcon(FaCircleQuestion)

export function WikiButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="wiki-button"
        aria-label="Help — 50/50 reference"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <QuestionIcon size={22} aria-hidden />
      </button>
      {open && <WikiDialog onClose={() => setOpen(false)} />}
    </>
  )
}
