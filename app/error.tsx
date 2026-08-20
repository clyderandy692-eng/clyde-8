'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ClydeWordmark } from '@/components/clyde/mark'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[v0] Unhandled route error:', error)
  }, [error])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <ClydeWordmark accent="bg-brand" />
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-balance">Cette page a rencontré un problème</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Vos données enregistrées sont intactes. Réessayez ou revenez au tableau de bord.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            Réessayer
          </Button>
          <Link
            href="/tableau-de-bord"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </main>
  )
}
