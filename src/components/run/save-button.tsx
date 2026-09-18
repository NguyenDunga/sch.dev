// Manual Save button (C6 / 12.9) — explicit save only (no autosave, SDD UX).
// Tapping it calls the store's save() (serializes to localStorage) and shows a
// brief "Saved!" confirmation. The timeout is cleaned up on unmount.

import { useEffect, useRef, useState } from 'react'
import { withIcon } from '@/components/ui/icon'
import { FaFloppyDisk } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'

const SaveIcon = withIcon(FaFloppyDisk)

const SAVED_MS = 1500

export function SaveButton({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const handleSave = () => {
    onSave()
    setSaved(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), SAVED_MS)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSave} aria-label="Save run">
      <SaveIcon size={16} aria-hidden />
      {saved ? 'Saved!' : 'Save'}
    </Button>
  )
}
