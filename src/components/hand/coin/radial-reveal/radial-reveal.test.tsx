// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RadialReveal } from './radial-reveal'
import { FaDumbbell, FaBolt } from 'react-icons/fa6'
import { withIcon } from '@/lib/icons'

const Dumbbell = withIcon(FaDumbbell)
const Bolt = withIcon(FaBolt)

const items = [
  { color: '#c07a10', icon: Dumbbell, label: 'Weight' },
  { color: '#1d90d6', icon: Bolt, label: 'Spark' },
]

afterEach(() => {
  cleanup()
})

describe('RadialReveal (M19)', () => {
  it('renders a ring, a disk, and the default icon', () => {
    render(
      <RadialReveal
        items={items}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Weight"
        size={100}
      />,
    )
    // The ring (conic-gradient) is present.
    const ring = document.querySelector('.radial-reveal-ring')
    expect(ring).toBeTruthy()
    // The disk is present.
    const disk = document.querySelector('.radial-reveal-disk')
    expect(disk).toBeTruthy()
    // The default icon is visible on the disk.
    const defaultLayer = document.querySelector('.radial-reveal-default')
    expect(defaultLayer).toBeTruthy()
    expect(defaultLayer!.querySelector('svg')).toBeTruthy()
    // The SVG ring hit areas are present (one pie-slice per item).
    const hits = document.querySelector('.radial-reveal-hits')
    expect(hits).toBeTruthy()
    expect(hits!.querySelectorAll('path')).toHaveLength(2)
  })

  it('radially wipes in the hovered item (reveal layer appears)', () => {
    render(
      <RadialReveal
        items={items}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Weight"
        size={100}
      />,
    )
    // No reveal layer by default.
    expect(document.querySelector('.radial-reveal-reveal')).toBeNull()
    // Hover the second wedge (Spark) → the reveal layer appears.
    const paths = document.querySelectorAll('.radial-reveal-hits path')
    fireEvent.mouseEnter(paths[1])
    const reveal = document.querySelector('.radial-reveal-reveal')
    expect(reveal).toBeTruthy()
    expect(reveal!.querySelector('svg')).toBeTruthy()
    // The expand: the glyph wrapper scales up from the wedge direction —
    // its transform-origin is the directional reveal origin (not the center).
    const glyph = reveal!.querySelector('.radial-reveal-glyph') as HTMLElement
    expect(glyph).toBeTruthy()
    expect(glyph.style.transformOrigin).toBeTruthy()
    expect(glyph.style.transformOrigin).not.toBe('50% 50%')
  })

  it('collapses back to the default when the disk is hovered', async () => {
    render(
      <RadialReveal
        items={items}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Weight"
        size={100}
      />,
    )
    const paths = document.querySelectorAll('.radial-reveal-hits path')
    fireEvent.mouseEnter(paths[0])
    expect(document.querySelector('.radial-reveal-reveal')).toBeTruthy()
    // Hover the disk → the reveal layer is removed (back to the default).
    // The exit wipe (AnimatePresence) runs ~250ms before the node unmounts.
    fireEvent.mouseEnter(document.querySelector('.radial-reveal-disk')!)
    await waitFor(() => expect(document.querySelector('.radial-reveal-reveal')).toBeNull(), { timeout: 1000 })
  })

  it('renders the short name below the icon (disk + reveal)', () => {
    render(
      <RadialReveal
        items={[
          { color: '#c07a10', icon: Dumbbell, label: 'Weight (75/25)', short: 'Weight' },
          { color: '#1d90d6', icon: Bolt, label: 'Spark', short: 'Spark' },
        ]}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Weight"
        defaultShort="Weight"
        size={100}
      />,
    )
    // The default short name is rendered below the icon on the disk.
    const defaultText = document.querySelector('.radial-reveal-default .radial-reveal-text')
    expect(defaultText).toBeTruthy()
    expect(defaultText!.textContent).toBe('Weight')
    // Hover the second wedge (Spark) → the reveal layer shows its short name.
    const paths = document.querySelectorAll('.radial-reveal-hits path')
    fireEvent.mouseEnter(paths[1])
    const revealText = document.querySelector('.radial-reveal-reveal .radial-reveal-text')
    expect(revealText).toBeTruthy()
    expect(revealText!.textContent).toBe('Spark')
  })

  it('shrinks long short names to fit the disk chord', () => {
    render(
      <RadialReveal
        items={[{ color: '#c07a10', icon: Dumbbell, label: 'Magnetic', short: 'Magnetic' }]}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Magnetic"
        defaultShort="Magnetic"
        size={44}
        ringWidth={6}
      />,
    )
    // 32px disk, 18px icon: "Magnetic" (8 chars) at the base 5px is wider than
    // the chord at the text position → the font is shrunk below the base.
    const el = document.querySelector('.radial-reveal-default .radial-reveal-text') as HTMLElement
    expect(el).toBeTruthy()
    expect(parseFloat(getComputedStyle(el).fontSize)).toBeLessThan(5)
  })

  it('keeps the base size when the short name fits', () => {
    render(
      <RadialReveal
        items={[{ color: '#c07a10', icon: Dumbbell, label: 'Tax', short: 'Tax' }]}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Tax"
        defaultShort="Tax"
        size={44}
        ringWidth={6}
      />,
    )
    const el = document.querySelector('.radial-reveal-default .radial-reveal-text') as HTMLElement
    expect(el).toBeTruthy()
    expect(parseFloat(getComputedStyle(el).fontSize)).toBe(5)
  })

  it('carries a single role="img" with the default + item labels', () => {
    render(
      <RadialReveal
        items={items}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Weight"
        size={100}
      />,
    )
    const img = screen.getByRole('img')
    expect(img.getAttribute('aria-label')).toBe('Weight — Weight, Spark')
  })

  it('renders only the default icon when there are no items', () => {
    render(
      <RadialReveal
        items={[]}
        defaultIcon={Dumbbell}
        defaultColor="#c07a10"
        defaultLabel="Weight"
        size={100}
      />,
    )
    const ring = document.querySelector('.radial-reveal-ring')
    expect(ring).toBeTruthy()
    // No hit areas (no items).
    expect(document.querySelector('.radial-reveal-hits path')).toBeNull()
    // The default icon is visible.
    expect(document.querySelector('.radial-reveal-default svg')).toBeTruthy()
  })
})
