import Link from 'next/link'
import { ArrowLeft, Store } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ClydeWordmark } from '@/components/clyde/mark'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <ClydeWordmark accent="bg-brand" />
        <span className="font-mono text-6xl font-semibold tracking-tight text-brand">404</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-balance">Cette page n’existe pas</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Le lien a peut-être changé. Retrouvez les commerces disponibles ou revenez à l’accueil.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/marketplace" className={cn(buttonVariants())}>
            <Store data-icon="inline-start" />
            Voir les commerces
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
            <ArrowLeft data-icon="inline-start" />
            Accueil
          </Link>
        </div>
      </div>
    </main>
  )
}
