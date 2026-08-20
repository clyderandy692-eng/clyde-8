'use client'

import Link from 'next/link'
import { ArrowLeft, Download, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClyde, useClydeReady } from '@/lib/clyde/store'
import { buildCsv, downloadCsv, safeFilename, todayStamp } from '@/lib/clyde/export'
import { EmptyState, SectionHeader } from './shell'
import { useOwnerContext } from './use-owner'

/**
 * La liste des abonnés d'une page — l'écran derrière la carte « Abonnés ».
 *
 * Le compteur seul frustrait : le commerçant voyait « 3 abonnés » sans jamais
 * pouvoir savoir qui, ni les recontacter. Ici il voit le nom, le WhatsApp,
 * l'e-mail et le quartier de chacun, et peut sortir le tout en fichier Excel
 * pour ses relances — ces contacts lui appartiennent, c'est la promesse de la
 * page d'accueil (« vous gardez l'accès complet à vos abonnés »).
 */
export function DashboardFollowers() {
  const { business } = useOwnerContext()
  useClydeReady()
  const allFollowers = useClyde((s) => s.followers)
  const users = useClyde((s) => s.users)

  if (!business) return null

  const rows = allFollowers
    .filter((f) => f.business_id === business.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((f) => {
      const account = users.find((u) => u.id === f.user_id) ?? null
      return {
        id: f.id,
        name: account?.name ?? 'Visiteur',
        whatsapp: account?.whatsapp_number ?? null,
        email: account?.email ?? null,
        neighborhood: account?.neighborhood ?? null,
        since: f.created_at,
      }
    })

  function exportExcel() {
    const csv = buildCsv(
      ['Nom', 'WhatsApp', 'E-mail', 'Quartier', 'Abonné depuis'],
      rows.map((r) => [
        r.name,
        r.whatsapp,
        r.email,
        r.neighborhood,
        new Date(r.since).toLocaleDateString('fr-FR'),
      ]),
    )
    downloadCsv(csv, `${safeFilename('abonnes', business!.name, todayStamp())}.csv`)
  }

  return (
    <>
      {/* Retour explicite : on arrive ici depuis une carte de l'accueil, le
          chemin inverse doit être aussi court que l'aller. */}
      <Link
        href="/tableau-de-bord"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour au tableau de bord
      </Link>

      <SectionHeader
        title="Vos abonnés"
        description={`${rows.length} ${rows.length > 1 ? 'personnes suivent' : 'personne suit'} ${business.name}. Ces contacts vous appartiennent — exportez-les quand vous voulez.`}
        action={
          rows.length > 0 ? (
            <Button onClick={exportExcel}>
              <Download className="size-4" aria-hidden="true" />
              Exporter (Excel)
            </Button>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun abonné pour l'instant"
          description="Partagez le lien de votre page : chaque visiteur peut s'abonner pour suivre vos nouveautés, et vous retrouverez ici son contact direct."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-background">
          <ul className="flex flex-col divide-y divide-border md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{r.name}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(r.since).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </time>
                </div>
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">WhatsApp</dt><dd>{r.whatsapp ?? '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">E-mail</dt><dd className="min-w-0 truncate">{r.email ?? '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Quartier</dt><dd>{r.neighborhood ?? '—'}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-border text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-3">Nom</th>
                <th scope="col" className="px-4 py-3">WhatsApp</th>
                <th scope="col" className="px-4 py-3">E-mail</th>
                <th scope="col" className="px-4 py-3">Quartier</th>
                <th scope="col" className="px-4 py-3">Abonné depuis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    {r.whatsapp ? (
                      <a
                        href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand hover:underline"
                      >
                        {r.whatsapp}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="hover:underline">
                        {r.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.neighborhood ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.since).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
