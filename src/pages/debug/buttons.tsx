// UI Debug — the Button component sections: variants, sizes, and states
// (pulse / loading / flash / disabled).

import { useState } from 'react'
import { withIcon } from '@/components/ui/icon'
import { FaPlus } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { iconSizes, textSizes, variants } from './options'

const PlusIcon = withIcon(FaPlus)

function FlashButton() {
  const [flash, setFlash] = useState(false)
  return (
    <Button
      flash={flash}
      onClick={() => setFlash(true)}
      onAnimationEnd={(e) => {
        if (e.animationName === 'btn-flash') setFlash(false)
      }}
    >
      Fire flash
    </Button>
  )
}

function LoadingButton() {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      loading={loading}
      onClick={() => {
        if (loading) return
        setLoading(true)
        setTimeout(() => setLoading(false), 1500)
      }}
    >
      {loading ? 'Tossing…' : 'Toss (1.5s)'}
    </Button>
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

/** The three Button demo sections (variants / sizes / states). */
export function ButtonSections() {
  return (
    <>
      <Section
        title="Button — variants"
        description="All cva variants, default size"
      >
        <div className="flex flex-wrap items-center gap-3">
          {variants.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Button — sizes" description="Text sizes xs → xl">
        <div className="flex flex-wrap items-end gap-3">
          {textSizes.map((s) => (
            <Button key={s} size={s}>
              {s}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {iconSizes.map((s) => (
            <Button key={s} size={s} aria-label={s}>
              <PlusIcon />
            </Button>
          ))}
        </div>
      </Section>

      <Section
        title="Button — states"
        description="pulse, loading, flash, disabled"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button pulse>Play (pulse)</Button>
          <LoadingButton />
          <FlashButton />
          <Button disabled>disabled</Button>
          <Button variant="outline" disabled>
            disabled outline
          </Button>
        </div>
      </Section>
    </>
  )
}
