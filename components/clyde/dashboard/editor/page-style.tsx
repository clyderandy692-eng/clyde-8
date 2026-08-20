/**
 * Réglages de style de la page entière.
 */

'use client'

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AMBIANCES, activeAmbianceId, applyAmbiance } from '@/lib/clyde/ambiances'
import { useLocale } from '@/lib/clyde/i18n'
import { LABELS } from './labels'
import { type PageTheme } from '@/lib/clyde/types'
import { Field } from './fields'

/**
 * Style GLOBAL de la page : ambiances toutes faites + couleurs fines.
 *
 * Les trois couleurs du thème (fond, texte, boutons) existaient dans le
 * modèle depuis le début mais n'avaient AUCUNE interface : impossible de
 * changer le fond de sa page entière. Les ambiances répondent au vrai besoin
 * du public visé — un rendu cohérent sans rien connaître aux couleurs.
 *
 * `onTheme(theme, true)` = appliquer une ambiance : le thème change ET les
 * couleurs posées à la main sur les blocs sont effacées, pour que toute la
 * page bascule d'un coup. Les pastilles fines, elles, ne touchent pas aux
 * blocs personnalisés (`onTheme(theme, false)`).
 */
export function PageStyleSettings({
  theme,
  onTheme,
}: {
  theme: PageTheme
  onTheme: (theme: PageTheme, alsoResetBlocks: boolean) => void
}) {
  const { locale } = useLocale()
  const copy = LABELS[locale]
  const active = activeAmbianceId(theme)
  const preset = theme.preset ?? 'vitrine'
  return (
    <section className="flex flex-col gap-4">
      {/* Genre de la page : vitrine (magazine) ou commande (app de
          livraison). Deux cartes descriptives, pas un select : le choix
          restructure toute la page, il mérite d'être compris avant le clic. */}
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{copy.pageGenre}</h3>
        <p className="text-xs text-muted-foreground">{copy.pageGenreHint}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onTheme({ ...theme, preset: 'vitrine' }, false)}
          aria-pressed={preset === 'vitrine'}
          className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-colors ${preset === 'vitrine' ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/40'}`}
        >
          <span className="text-sm font-semibold">{copy.genreVitrine}</span>
          <span className="text-[11px] leading-snug text-muted-foreground">{copy.genreVitrineDesc}</span>
        </button>
        <button
          type="button"
          onClick={() => onTheme({ ...theme, preset: 'commande' }, false)}
          aria-pressed={preset === 'commande'}
          className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-colors ${preset === 'commande' ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/40'}`}
        >
          <span className="text-sm font-semibold">{copy.genreCommande}</span>
          <span className="text-[11px] leading-snug text-muted-foreground">{copy.genreCommandeDesc}</span>
        </button>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        <h3 className="font-medium">{copy.ambiance}</h3>
        <p className="text-xs text-muted-foreground">{copy.ambianceHint}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {AMBIANCES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onTheme(applyAmbiance(theme, a), true)}
            className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-colors ${active === a.id ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/40'}`}
            aria-pressed={active === a.id}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg border"
              style={{ background: a.background }}
              aria-hidden
            >
              <span className="size-4 rounded-full" style={{ background: a.brand }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{a.label}</span>
              <span className="block truncate text-[11px] opacity-60">
                {a.background === '#171410' || a.background === '#0F172A' ? 'Fond sombre' : 'Fond clair'}
              </span>
            </span>
          </button>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="font-medium">{copy.pageColors}</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label={copy.pageBackground}>
            <Input type="color" value={theme.background} onChange={(e) => onTheme({ ...theme, background: e.target.value }, false)} />
          </Field>
          <Field label={copy.pageInk}>
            <Input type="color" value={theme.ink} onChange={(e) => onTheme({ ...theme, ink: e.target.value }, false)} />
          </Field>
          <Field label={copy.pageBrand}>
            <Input type="color" value={theme.brand} onChange={(e) => onTheme({ ...theme, brand: e.target.value }, false)} />
          </Field>
        </div>
      </div>
    </section>
  )
}
