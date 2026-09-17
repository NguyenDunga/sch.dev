import { useState } from 'react'
import { withIcon } from '@/lib/icons'
import { FaMoon, FaPlus, FaSun } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const MoonIcon = withIcon(FaMoon)
const PlusIcon = withIcon(FaPlus)
const SunIcon = withIcon(FaSun)

const textSizes = ['xs', 'sm', 'default', 'lg', 'xl'] as const
const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const
const variants = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const

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

function Section({
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

export function DebugPage() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <div>
            <h1 className="font-heading text-lg font-semibold">
              UI Debug
            </h1>
            <p className="text-xs text-muted-foreground">
              Every component in <code>src/components/ui</code> gets a section
              here
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={() => {
                const next = !dark
                document.documentElement.classList.toggle('dark', next)
                setDark(next)
              }}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button variant="link" onClick={() => (window.location.href = '/')}>
              ← Home
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
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
      </main>
    </div>
  )
}
