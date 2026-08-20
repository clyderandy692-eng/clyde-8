'use client'

import Link from 'next/link'
import { BadgeCheck, Building2, CalendarDays, Hash } from 'lucide-react'
import { engineerId, engineerPost } from '@/lib/clyde/factory'
import { useLocale } from '@/lib/clyde/i18n'
import { useClyde, useClydeReady } from '@/lib/clyde/store'

/**
 * Registre de vérification des certificats CLYDE.
 *
 * Le matricule est déterministe à partir du commerce : le QR imprimé et cette
 * page ne peuvent donc pas diverger après un rechargement. Dans le prototype
 * local, le registre couvre les données disponibles dans le store hydraté ; la
 * future base distante conservera exactement cette URL publique.
 */
export function CertificateVerification({ matricule }: { matricule: string }) {
  const ready = useClydeReady()
  const { locale } = useLocale()
  const businesses = useClyde((state) => state.businesses)
  const users = useClyde((state) => state.users)
  const pages = useClyde((state) => state.pages)

  const normalized = decodeURIComponent(matricule).trim().toUpperCase()
  const business = ready
    ? businesses.find((item) => engineerId(item.id) === normalized)
    : undefined
  const owner = users.find((item) => item.id === business?.owner_id)
  const published = pages.find((item) => item.business_id === business?.id)?.published
  const valid = Boolean(business && published)

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 md:px-8">
        <div className="h-72 animate-pulse rounded-3xl border border-border bg-card" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-5 md:px-8">
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <header className="flex items-center gap-4 border-b border-border p-6 sm:p-8">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
            <BadgeCheck className="size-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.16em] text-brand uppercase">
              Registre CLYDE
            </p>
            <h1 className="mt-1 text-balance text-2xl font-bold sm:text-3xl">
              {valid ? 'Certificat authentifié' : 'Certificat introuvable'}
            </h1>
          </div>
        </header>

        {valid && business ? (
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Ce matricule correspond à une page publiée et à un certificat
              délivré par la Direction de l’Usine CLYDE.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              <VerificationField icon={Building2} label="Commerce" value={business.name} />
              <VerificationField
                icon={BadgeCheck}
                label="Ingénieur"
                value={owner?.name ?? business.name}
              />
              <VerificationField
                icon={Hash}
                label="Matricule"
                value={normalized}
                mono
              />
              <VerificationField
                icon={CalendarDays}
                label="Intégration"
                value={new Date(business.created_at).toLocaleDateString(
                  locale === 'en' ? 'en-GB' : 'fr-FR',
                  { day: '2-digit', month: 'long', year: 'numeric' },
                )}
              />
            </dl>
            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Poste reconnu</p>
              <p className="mt-1 font-semibold">{engineerPost(business.category, locale)}</p>
            </div>
            <Link
              href={`/r/${business.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
            >
              Voir la vitrine certifiée
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <p className="leading-relaxed text-muted-foreground">
              Aucun certificat publié ne correspond au matricule
              <span className="font-mono font-semibold text-foreground"> {normalized}</span>.
              Vérifiez les caractères ou demandez une nouvelle copie au commerce.
            </p>
            <Link href="/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              Revenir à CLYDE
            </Link>
          </div>
        )}
      </article>
    </div>
  )
}

function VerificationField({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: typeof BadgeCheck
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={mono ? 'mt-1 truncate font-mono text-sm font-bold' : 'mt-1 font-semibold'}>
          {value}
        </dd>
      </div>
    </div>
  )
}
