'use client'

import { ArrowDown, PartyPopper, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/clyde/i18n'
import { useClyde, useClydeReady } from '@/lib/clyde/store'
import {
  ACTIVATION_WELCOME_KEY,
  FIRST_RUN_PARAM,
  hasActivationCheck,
} from '@/lib/clyde/activation'

/** Cible du bouton principal — la checklist, juste en dessous. */
const ACTIVATION_ANCHOR = 'activation'

/**
 * Accueil affiché une seule fois, au retour de l'inscription.
 *
 * Ce n'est pas une visite guidée pas-à-pas : superposer des bulles sur un
 * tableau de bord qu'on découvre force à tout lire avant de rien faire. On
 * situe l'écran en trois lignes, puis on renvoie vers la seule chose qui compte
 * — les quatre étapes — et l'on s'effface définitivement.
 *
 * L'effacement passe par `markActivationDone`, le même mécanisme irréversible
 * que les autres constats : « cette personne a vu l'accueil » est un fait, pas
 * une préférence, et il n'existe aucune raison de le rejouer.
 */
export function FirstRunWelcome({
  businessId,
  /* Un commerçant déjà installé n'a pas besoin qu'on lui souhaite la
     bienvenue : l'appelant nous le dit plutôt que de nous faire recalculer
     l'activation une seconde fois. */
  activationDone,
}: {
  businessId: string
  activationDone: boolean
}) {
  const t = useT()
  const ac = t.dashboard.overview.activation
  const ready = useClydeReady()
  const checks = useClyde((s) => s.activationChecks)
  const markActivationDone = useClyde((s) => s.markActivationDone)

  const seen = hasActivationCheck(checks, businessId, ACTIVATION_WELCOME_KEY)

  /* On attend la relecture du stockage : rendre avant, c'est afficher l'accueil
     à quelqu'un qui l'a déjà écarté, puis le faire disparaître sous ses yeux. */
  if (!ready || seen || activationDone) return null

  /* Lecture directe de l'URL, et non `useSearchParams` : ce hook fait sortir
     toute la page du prérendu statique pour un paramètre qui n'intéresse qu'un
     seul passage. `ready` étant faux au rendu serveur comme à l'hydratation,
     cette ligne ne s'exécute que sur le client — sans écart d'hydratation. */
  const requested =
    new URLSearchParams(window.location.search).get(FIRST_RUN_PARAM) === '1'
  if (!requested) return null

  const dismiss = () => markActivationDone(businessId, ACTIVATION_WELCOME_KEY)

  const goToSteps = () => {
    dismiss()
    /* La carte disparaît au même rendu : sans le report, on mesurerait la
       position de l'ancre avant que la mise en page ne se resserre, et le
       défilement s'arrêterait quelques centaines de pixels trop bas. */
    requestAnimationFrame(() => {
      document
        .getElementById(ACTIVATION_ANCHOR)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <section
      /* `polite` : l'accueil arrive à l'ouverture de l'écran, il ne doit pas
         couper l'annonce du titre de page. */
      aria-live="polite"
      className="relative mb-6 overflow-hidden rounded-2xl border border-brand/30 bg-brand/8 p-5 sm:p-6"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label={ac.welcomeDismiss}
        className="absolute top-3 right-3 text-muted-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-brand-foreground"
          aria-hidden="true"
        >
          <PartyPopper className="size-5" />
        </span>
        <div className="flex flex-col gap-3 pr-8 sm:pr-10">
          <div>
            <h2 className="text-balance text-lg font-bold tracking-tight">
              {ac.welcomeTitle}
            </h2>
            <p className="mt-1.5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {ac.welcomeBody}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={goToSteps}>
              {ac.welcomeAction}
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="sm" onClick={dismiss}>
              {ac.welcomeDismiss}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
