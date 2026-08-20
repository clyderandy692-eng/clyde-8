/**
 * Réglages de style d'un bloc : ambiance, couleurs, rayons, espacements.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { hasCustomColors, resetOneBlockColors } from '@/lib/clyde/ambiances'
import { BLOCK_STYLE_PRESETS, type Copy } from './labels'
import { type Block, type BlockStyle, type Business } from '@/lib/clyde/types'
import { Field } from './fields'

/**
 * Apparence d'un bloc, réorganisée en trois groupes nommés — Texte, Couleurs,
 * Espacement — au lieu d'une colonne continue où tout se confondait.
 *
 * Les couleurs restent OPTIONNELLES : par défaut le bloc suit l'ambiance de
 * la page, et « Revenir aux couleurs de la page » efface les choix manuels —
 * le filet de sécurité qui permet d'essayer sans risque.
 */
export function StyleSettings({ block, copy, onChange }: { block: Block; copy: Copy; onChange: (patch: Partial<Block>) => void }) {
  const style = block.style ?? {}
  function patchStyle(patch: Partial<BlockStyle>) { onChange({ style: { ...style, ...patch } }) }
  const custom = hasCustomColors(block)
  return (
    <section className="flex flex-col gap-4">
      <Separator />
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{copy.style}</h3>
        <Button
          size="sm"
          variant="ghost"
          disabled={Object.keys(style).length === 0}
          title={copy.resetStyleHint}
          onClick={() => onChange({ style: {} })}
        >
          {copy.resetStyle}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {copy.delete === 'Supprimer' ? 'Styles par métier' : 'Business presets'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_STYLE_PRESETS.map((preset) => {
            const language = copy.delete === 'Supprimer' ? 'fr' : 'en'
            return (
              <button
                key={preset.id}
                type="button"
                className="flex min-h-14 flex-col justify-center rounded-xl border px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-muted"
                onClick={() => onChange({ style: { ...preset.style } })}
              >
                <span className="text-sm font-medium">{preset.label[language]}</span>
                <span className="text-xs text-muted-foreground">{preset.hint[language]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{copy.typography}</p>
        <Field label={copy.alignment}>
          <div className="grid grid-cols-3 gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <Button key={align} size="sm" variant={style.align === align ? 'default' : 'outline'} onClick={() => patchStyle({ align })}>
                {copy[align]}
              </Button>
            ))}
          </div>
        </Field>
        <Field label={copy.scale}>
          <Input type="range" min="0.8" max="1.3" step="0.05" value={style.fontScale ?? 1} onChange={(e) => patchStyle({ fontScale: Number(e.target.value) })} />
        </Field>
        <Field label={copy.weight}>
          {/* Des mots, pas des nombres : « 600 » ne dit rien à qui n'est pas
              designer. */}
          <select className="h-8 rounded-lg border bg-background px-2 text-sm" value={style.fontWeight ?? 600} onChange={(e) => patchStyle({ fontWeight: Number(e.target.value) as BlockStyle['fontWeight'] })}>
            <option value="300">Léger</option>
            <option value="400">Normal</option>
            <option value="500">Moyen</option>
            <option value="600">Gras</option>
            <option value="700">Très gras</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{copy.colors}</p>
          {custom && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {copy.customColorsOn}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['background', 'textColor', 'brandColor'] as const).map((key) => (
            <Field key={key} label={copy[key]}>
              <Input type="color" value={style[key] ?? '#ffffff'} onChange={(e) => patchStyle({ [key]: e.target.value })} />
            </Field>
          ))}
        </div>
        {/* Retour à l'ambiance : efface UNIQUEMENT les couleurs manuelles de
            CE bloc, les autres réglages (alignement, taille…) restent. */}
        <Button
          size="sm"
          variant="outline"
          disabled={!custom}
          onClick={() => {
            const reset = resetOneBlockColors(block)
            onChange({ style: reset.style ?? {} })
          }}
        >
          {copy.resetColors}
        </Button>
        {!custom && (
          <p className="text-xs text-muted-foreground">
            Ce bloc suit les couleurs de la page. Touchez une pastille pour le personnaliser.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{copy.spacing}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={copy.vertical}>
            <Input type="number" min="0" max="120" value={style.paddingY ?? 32} onChange={(e) => patchStyle({ paddingY: Number(e.target.value) })} />
          </Field>
          <Field label={copy.horizontal}>
            <Input type="number" min="0" max="80" value={style.paddingX ?? 20} onChange={(e) => patchStyle({ paddingX: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label={copy.radius}>
          <select className="h-8 rounded-lg border bg-background px-2 text-sm" value={style.radius ?? 'soft'} onChange={(e) => patchStyle({ radius: e.target.value as BlockStyle['radius'] })}>
            <option value="sharp">{copy.sharp}</option>
            <option value="soft">{copy.soft}</option>
            <option value="round">{copy.round}</option>
          </select>
        </Field>
      </div>
    </section>
  )
}
