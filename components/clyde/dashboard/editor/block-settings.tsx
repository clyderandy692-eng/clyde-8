/**
 * Réglages propres à chaque type de bloc.
 */

'use client'

import { Image, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader } from '../media-uploader'
import { Field, ToggleRow } from './fields'
import { type Copy } from './labels'
import { StyleSettings } from './style-settings'
import { type Block, type CatalogueBlock, type ContactBlock, type HeroBlock, type HoursLocationBlock, type BookingBlock, type CategoriesBlock, type CarouselBlock, type PromoBlock, type Product, type SearchBlock, type ReviewBlock, type FaqBlock, type BottomNavBlock, type ImageGalleryBlock, type VideoBlock, type IdentityMediaBlock } from '@/lib/clyde/types'

export function isUploadedVideo(url: string): boolean {
  if (!url) return false
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url) || url.includes('blob.vercel-storage.com')
}

export function BlockSettings({ block, businessId, products, copy, onChange }: { block: Block; businessId: string; products: Product[]; copy: Copy; onChange: (patch: Partial<Block>) => void }) {
  return (
    <div className="flex flex-col gap-6">
      {(['hero', 'catalogue', 'categories', 'carousel', 'promo', 'search', 'reviews', 'faq', 'booking', 'hours_location', 'contact', 'identity_media', 'image_gallery', 'bottom_nav', 'video'] as const).includes(block.type as never) && (
        <CoreSettings block={block} businessId={businessId} products={products} copy={copy} onChange={onChange} />
      )}
      <StyleSettings block={block} copy={copy} onChange={onChange} />
    </div>
  )
}

export function CoreSettings({ block, businessId, products, copy, onChange }: { block: Block; businessId: string; products: Product[]; copy: Copy; onChange: (patch: Partial<Block>) => void }) {
  if (block.type === 'hero') {
    const b = block as HeroBlock
    {/* Plus de champs « bouton » : la couverture n'a plus de CTA — le
        catalogue est immédiatement dessous, un bouton n'y menait qu'en
        doublon. Rester sur titre, sous-titre, image et photo de profil garde
        l'inspecteur aussi minimal que le rendu. */}
    return <section className="flex flex-col gap-4"><h3 className="font-medium">{copy.hero}</h3><Field label={copy.titleField}><Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} /></Field><Field label={copy.subtitle}><Textarea value={b.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} /></Field><Field label="Image de couverture">
      {/* Téléversement d'abord (le vendeur a la photo sur son téléphone),
          l'URL reste possible en dessous pour une image déjà hébergée. */}
      <MediaUploader
        businessId={businessId}
        kind="cover"
        accept="image/*"
        value={b.imageUrl}
        onChange={(url) => onChange({ imageUrl: (Array.isArray(url) ? url[0] : url) || '' })}
        label="Téléverser une image de couverture"
      />
      <Input className="mt-2" placeholder={copy.imageUrl} value={b.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })} />
    </Field><div className="grid grid-cols-2 gap-3"><Field label={copy.variant}><select className="h-8 rounded-lg border bg-background px-2 text-sm" value={b.variant} onChange={(e) => onChange({ variant: e.target.value as HeroBlock['variant'] })}><option value="center">Center</option><option value="bottom">Bottom</option><option value="edge">Edge</option></select></Field><Field label={copy.height}><select className="h-8 rounded-lg border bg-background px-2 text-sm" value={b.height} onChange={(e) => onChange({ height: e.target.value as HeroBlock['height'] })}><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></Field></div><Field label={copy.overlay}><Input type="range" min="0" max="90" value={b.overlay} onChange={(e) => onChange({ overlay: Number(e.target.value) })} /></Field>
      <Separator />
      <ToggleRow
        label={copy.heroLogo}
        /* `?? true` : le rendu affiche le cercle par défaut, l'interrupteur
           doit refléter cet état — sinon il paraît éteint alors que le cercle
           est visible. */
        checked={b.logo?.enabled ?? true}
        onChange={(enabled) =>
          onChange({
            /* On complète les réglages manquants : un logo activé sans taille
               ni position ne saurait pas où se dessiner. */
            logo: { size: 'md', align: 'left', ...b.logo, enabled },
          })
        }
      />
      {/* `!== false` et non truthy : les pages existantes n'ont pas d'objet
          `logo`, or le cercle s'y affiche par défaut — leurs réglages doivent
          donc être accessibles aussi. */}
      {b.logo?.enabled !== false ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={copy.heroLogoSize}>
              <select
                className="h-8 rounded-lg border bg-background px-2 text-sm"
                value={b.logo?.size ?? 'md'}
                onChange={(e) => onChange({ logo: { align: 'left', enabled: true, ...b.logo, size: e.target.value as 'sm' | 'md' | 'lg' } })}
              >
                <option value="sm">{copy.sizeS}</option>
                <option value="md">{copy.sizeM}</option>
                <option value="lg">{copy.sizeL}</option>
              </select>
            </Field>
            <Field label={copy.heroLogoAlign}>
              <select
                className="h-8 rounded-lg border bg-background px-2 text-sm"
                value={b.logo?.align ?? 'left'}
                onChange={(e) => onChange({ logo: { size: 'md', enabled: true, ...b.logo, align: e.target.value as 'left' | 'center' | 'right' } })}
              >
                <option value="left">{copy.alignLeft}</option>
                <option value="center">{copy.alignCenter}</option>
                <option value="right">{copy.alignRight}</option>
              </select>
            </Field>
          </div>
          <MediaUploader
            businessId={businessId}
            kind="logo"
            accept="image/*"
            value={b.logo?.url ?? ''}
            onChange={(url) => onChange({ logo: { size: 'md', align: 'left', enabled: true, ...b.logo, url: typeof url === 'string' ? url : url[0] } })}
          />
          <p className="text-xs text-muted-foreground">{copy.heroLogoHint}</p>
        </>
      ) : null}
    </section>
  }
  if (block.type === 'catalogue') {
    const b = block as CatalogueBlock
    return <section className="flex flex-col gap-4"><h3 className="font-medium">{copy.catalogue}</h3><Field label={copy.catalogueTitle}><Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} /></Field><div className="grid grid-cols-2 gap-3"><Field label={copy.display}><select className="h-8 rounded-lg border bg-background px-2 text-sm" value={b.display} onChange={(e) => onChange({ display: e.target.value as CatalogueBlock['display'] })}><option value="grid">{copy.grid}</option><option value="list">{copy.list}</option></select></Field><Field label={copy.columns}><select className="h-8 rounded-lg border bg-background px-2 text-sm" value={b.columns} onChange={(e) => onChange({ columns: Number(e.target.value) as CatalogueBlock['columns'] })}><option value="2">2</option><option value="3">3</option></select></Field></div><Field label={copy.actionLabel}><Input value={b.actionLabel} onChange={(e) => onChange({ actionLabel: e.target.value })} /></Field><ToggleRow label={copy.showPrice} checked={b.showPrice} onChange={(showPrice) => onChange({ showPrice })} /><ToggleRow label={copy.showRating} checked={b.showRating} onChange={(showRating) => onChange({ showRating })} /></section>
  }
  if (block.type === 'categories') {
    const b = block as CategoriesBlock
    return <section className="flex flex-col gap-4"><h3 className="font-medium">{copy.categories}</h3>
      {/* Au-delà d'une poignée de catégories, le mode `wrap` empilait les
          pastilles jusqu'à repousser le catalogue hors de l'écran. */}
      <Field label={copy.categoryDisplay}>
        <select
          className="h-8 rounded-lg border bg-background px-2 text-sm"
          value={b.display ?? 'wrap'}
          onChange={(e) => onChange({ display: e.target.value as CategoriesBlock['display'] })}
        >
          <option value="wrap">{copy.categoryWrap}</option>
          <option value="scroll">{copy.categoryScroll}</option>
          <option value="card">{copy.categoryCard}</option>
        </select>
      </Field>
      <ToggleRow label={copy.autoCategories} checked={b.autoFromCatalogue} onChange={(autoFromCatalogue) => onChange({ autoFromCatalogue })} /><Field label={copy.categoryItems}><Textarea value={b.items.join('\n')} onChange={(e) => onChange({ items: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} /><p className="text-xs text-muted-foreground">{copy.categoryHint}</p></Field></section>
  }
  if (block.type === 'booking') {
    const b = block as BookingBlock
    return <section className="flex flex-col gap-4"><h3 className="font-medium">{copy.booking}</h3><Field label={copy.titleField}><Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} /></Field><Field label={copy.descriptionField}><Textarea value={b.description} onChange={(e) => onChange({ description: e.target.value })} /></Field><Field label={copy.cta}><Input value={b.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} /></Field><Field label={copy.bookingDays}><Input type="number" min="1" max="60" value={b.daysAhead} onChange={(e) => onChange({ daysAhead: Math.max(1, Number(e.target.value) || 1) })} /></Field></section>
  }
  if (block.type === 'hours_location') {
    const b = block as HoursLocationBlock
    /* Les horaires eux-mêmes étaient invisibles ici : le bloc les AFFICHE sur
       la page mais l'éditeur n'offrait que titre et adresse — pour changer
       « Lun–Ven 9h–18h » il fallait fouiller ailleurs. Une ligne par jour. */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">{copy.hours}</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label={copy.address}>
          <Input value={b.address} onChange={(e) => onChange({ address: e.target.value })} />
        </Field>
        <Field label={copy.mapQuery}>
          <Input value={b.mapQuery} onChange={(e) => onChange({ mapQuery: e.target.value })} />
        </Field>
        <Field label="Horaires affichés">
          <div className="flex flex-col gap-2">
            {b.hours.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="w-2/5"
                  placeholder="Jour(s)"
                  value={h.day}
                  onChange={(e) =>
                    onChange({
                      hours: b.hours.map((it, j) => (j === i ? { ...it, day: e.target.value } : it)),
                    })
                  }
                />
                <Input
                  className="flex-1"
                  placeholder="Ex. : 9h – 18h"
                  value={h.value}
                  onChange={(e) =>
                    onChange({
                      hours: b.hours.map((it, j) => (j === i ? { ...it, value: e.target.value } : it)),
                    })
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer la ligne ${h.day || i + 1}`}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onChange({ hours: b.hours.filter((_, j) => j !== i) })}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange({ hours: [...b.hours, { day: '', value: '' }] })}
            >
              Ajouter une ligne
            </Button>
          </div>
        </Field>
      </section>
    )
  }
  if (block.type === 'contact') {
    const b = block as ContactBlock
    /* Les réseaux sociaux s'affichent sur la page mais étaient inaccessibles
       ici : impossible d'ajouter son Instagram ou de corriger un lien. */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">{copy.contact}</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label={copy.descriptionField}>
          <Textarea value={b.description} onChange={(e) => onChange({ description: e.target.value })} />
        </Field>
        <Field label={copy.cta}>
          <Input value={b.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} />
        </Field>
        <Field label={copy.phone}>
          <Input value={b.phone} onChange={(e) => onChange({ phone: e.target.value })} />
        </Field>
        <Field label={copy.email}>
          <Input value={b.email} onChange={(e) => onChange({ email: e.target.value })} />
        </Field>
        <Field label="Réseaux sociaux">
          <div className="flex flex-col gap-2">
            {b.socials.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Input
                  className="w-2/5"
                  placeholder="Nom (Instagram…)"
                  value={s.label}
                  onChange={(e) =>
                    onChange({
                      socials: b.socials.map((it) => (it.id === s.id ? { ...it, label: e.target.value } : it)),
                    })
                  }
                />
                <Input
                  className="flex-1"
                  placeholder="https://…"
                  value={s.url}
                  onChange={(e) =>
                    onChange({
                      socials: b.socials.map((it) => (it.id === s.id ? { ...it, url: e.target.value } : it)),
                    })
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer ${s.label || 'ce réseau'}`}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onChange({ socials: b.socials.filter((it) => it.id !== s.id) })}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  socials: [...b.socials, { id: `soc-${Date.now()}`, label: '', url: '' }],
                })
              }
            >
              Ajouter un réseau
            </Button>
          </div>
        </Field>
      </section>
    )
  }
  if (block.type === 'identity_media') {
    const b = block as IdentityMediaBlock
    return <section className="flex flex-col gap-4"><h3 className="font-medium">Logo & profil</h3><Field label={copy.titleField}><Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} /></Field><Field label={copy.subtitle}><Textarea value={b.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} /></Field><ToggleRow label="Afficher le logo" checked={b.showLogo} onChange={(showLogo) => onChange({ showLogo })} /><ToggleRow label="Afficher la catégorie" checked={b.showProfile} onChange={(showProfile) => onChange({ showProfile })} /></section>
  }
  if (block.type === 'search') {
    const b = block as SearchBlock
    /* La barre de recherche n'avait AUCUN réglage : le texte d'invite était
       figé alors qu'un restaurant veut « Chercher un plat » et un salon
       « Chercher une prestation ». */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">Barre de recherche</h3>
        <Field label="Texte d'invite">
          <Input
            placeholder="Ex. : Chercher un plat…"
            value={b.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </Field>
        <ToggleRow
          label="Bouton de filtres"
          checked={b.showFilter}
          onChange={(showFilter) => onChange({ showFilter })}
        />
      </section>
    )
  }
  if (block.type === 'reviews') {
    const b = block as ReviewBlock
    /* Les avis affichés viennent des VRAIS clients — pas de liste à éditer
       ici, ce serait fabriquer de faux avis. On règle le titre et la forme. */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">Avis & Témoignages</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <ToggleRow
          label="Afficher en onglets (Infos / Réservation / Avis)"
          checked={b.withTabs}
          onChange={(withTabs) => onChange({ withTabs })}
        />
        <p className="text-xs text-muted-foreground">
          Les avis affichés sont ceux déposés par vos clients sur la page.
        </p>
      </section>
    )
  }
  if (block.type === 'faq') {
    const b = block as FaqBlock
    /* La FAQ n'avait AUCUN réglage : les questions livrées avec le modèle
       restaient gravées — impossible de répondre aux vraies questions de SES
       clients. Une carte par question, ajout et suppression libres. */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">FAQ</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Questions & réponses">
          <div className="flex flex-col gap-3">
            {b.items.map((item, i) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-xl border p-2.5">
                <Input
                  placeholder={`Question ${i + 1}`}
                  value={item.q}
                  onChange={(e) =>
                    onChange({
                      items: b.items.map((it) => (it.id === item.id ? { ...it, q: e.target.value } : it)),
                    })
                  }
                />
                <Textarea
                  placeholder="Réponse"
                  value={item.a}
                  onChange={(e) =>
                    onChange({
                      items: b.items.map((it) => (it.id === item.id ? { ...it, a: e.target.value } : it)),
                    })
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onChange({ items: b.items.filter((it) => it.id !== item.id) })}
                >
                  Supprimer
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  items: [...b.items, { id: `faq-${Date.now()}`, q: '', a: '' }],
                })
              }
            >
              Ajouter une question
            </Button>
          </div>
        </Field>
      </section>
    )
  }
  if (block.type === 'carousel') {
    const b = block as CarouselBlock
    /* `glass` (hérité) est rendu comme `caption` : on le normalise ici. */
    const variant = b.variant === 'glass' ? 'caption' : (b.variant ?? 'overlay')
    const source = b.source ?? 'products'
    /* Seuls les produits de CE commerce : le sélecteur listait sinon tout le
       catalogue de la plateforme. */
    const own = products.filter((p) => p.business_id === businessId)
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">Carrousel</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>

        {/* Que montre le carrousel ? Deux gros boutons, pas un select : le
            choix est structurant et doit se voir d'un coup d'œil. */}
        <Field label="Que montre le carrousel ?">
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              variant={source === 'products' ? 'default' : 'outline'}
              onClick={() => onChange({ source: 'products' })}
            >
              Mes produits
            </Button>
            <Button
              size="sm"
              variant={source === 'images' ? 'default' : 'outline'}
              onClick={() => onChange({ source: 'images' })}
            >
              Mes images
            </Button>
          </div>
        </Field>

        {source === 'images' ? (
          <Field label="Images du carrousel">
            {/* Visuels promotionnels libres — affiches, offres, coulisses. */}
            <MediaUploader
              businessId={businessId}
              kind="gallery"
              accept="image/*"
              multiple
              value={b.images ?? []}
              onChange={(images) => onChange({ images: Array.isArray(images) ? images : [images] })}
              label="Téléverser des images"
            />
          </Field>
        ) : (
          <Field label="Produits affichés">
            {/* Cases à cocher avec vignette : on voit ce qu'on choisit. Rien
                de coché = les six premiers du catalogue (comportement
                d'origine), dit clairement sous la liste. */}
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl border p-1.5">
              {own.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  Ajoutez d&apos;abord des produits à votre catalogue.
                </p>
              ) : (
                own.map((p) => {
                  const checked = b.productIds.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 ${checked ? 'bg-primary/10' : 'hover:bg-muted'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange({
                            productIds: checked
                              ? b.productIds.filter((id) => id !== p.id)
                              : [...b.productIds, p.id],
                          })
                        }
                        className="size-4 shrink-0 accent-primary"
                      />
                      {p.media_urls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.media_urls[0] || '/placeholder.svg'}
                          alt=""
                          className="size-8 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-[10px] text-muted-foreground">
                          —
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                    </label>
                  )
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Rien de coché = les 6 premiers produits du catalogue.
            </p>
          </Field>
        )}

        <Field label="Style des cartes">
          <select
            className="h-8 rounded-lg border bg-background px-2 text-sm"
            value={variant}
            onChange={(e) => onChange({ variant: e.target.value as CarouselBlock['variant'] })}
          >
            <option value="overlay">Photo + dégradé sombre</option>
            <option value="caption">Cartouche sombre + badge prix</option>
            <option value="card">Photo + cartouche dessous</option>
          </select>
        </Field>
      </section>
    )
  }
  if (block.type === 'promo') {
    const b = block as PromoBlock
    const own = products.filter((p) => p.business_id === businessId)
    /* La bannière n'avait AUCUN réglage de contenu : titre, texte et bouton
       étaient figés, seule l'apparence s'ouvrait — le commerçant ne pouvait
       même pas écrire son offre. */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">Bannière promo</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label={copy.descriptionField}>
          <Textarea value={b.description} onChange={(e) => onChange({ description: e.target.value })} />
        </Field>
        <Field label={copy.cta}>
          <Input value={b.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} />
        </Field>
        <Field label="Produit mis en avant">
          <select
            className="h-8 rounded-lg border bg-background px-2 text-sm"
            value={b.productId ?? ''}
            onChange={(e) => onChange({ productId: e.target.value || null })}
          >
            <option value="">Aucun — offre générale</option>
            {own.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fin de l'offre (compte à rebours)">
          <Input
            type="datetime-local"
            value={b.endsAt ? b.endsAt.slice(0, 16) : ''}
            onChange={(e) =>
              onChange({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
          <p className="text-xs text-muted-foreground">
            Vide = pas de compte à rebours affiché.
          </p>
        </Field>
      </section>
    )
  }
  if (block.type === 'bottom_nav') {
    const b = block as BottomNavBlock
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">Menu mobile</h3>
        <Field label="Style du menu">
          <select
            className="h-8 rounded-lg border bg-background px-2 text-sm"
            value={b.navStyle ?? 'floating'}
            onChange={(e) => onChange({ navStyle: e.target.value as BottomNavBlock['navStyle'] })}
          >
            <option value="floating">Flottant, action centrale</option>
            <option value="dark-pill">Pilule sombre</option>
            <option value="docked">Barre pleine largeur</option>
            <option value="minimal">Minimal, icônes seules</option>
          </select>
        </Field>
        <p className="text-xs text-muted-foreground">
          Le style s&apos;applique sur téléphone. Aperçu immédiat dans le simulateur mobile.
        </p>
      </section>
    )
  }
  if (block.type === 'video') {
    const b = block as VideoBlock
    /* Le bloc Vidéo n'avait AUCUN réglage : impossible de téléverser ou même
       de coller un lien. Téléversement d'un fichier (lu en <video> natif) ou
       lien YouTube — les deux alimentent le même champ `url`. */
    return (
      <section className="flex flex-col gap-4">
        <h3 className="font-medium">Vidéo</h3>
        <Field label={copy.titleField}>
          <Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Fichier vidéo">
          <MediaUploader
            businessId={businessId}
            kind="video"
            accept="video/*"
            value={isUploadedVideo(b.url) ? b.url : ''}
            onChange={(url) => onChange({ url: (Array.isArray(url) ? url[0] : url) || '' })}
            label="Téléverser une vidéo"
          />
        </Field>
        <Field label="Ou lien YouTube">
          <Input
            placeholder="https://youtube.com/watch?v=…"
            value={isUploadedVideo(b.url) ? '' : b.url}
            onChange={(e) => onChange({ url: e.target.value })}
          />
        </Field>
        <Field label="Légende">
          <Input value={b.caption} onChange={(e) => onChange({ caption: e.target.value })} />
        </Field>
      </section>
    )
  }
  if (block.type === 'image_gallery') {
    const b = block as ImageGalleryBlock
    return <section className="flex flex-col gap-4"><h3 className="font-medium">Galerie photos</h3><Field label={copy.titleField}><Input value={b.title} onChange={(e) => onChange({ title: e.target.value })} /></Field><MediaUploader businessId={businessId} kind="gallery" multiple value={b.images} onChange={(images) => onChange({ images: Array.isArray(images) ? images : [images] })} /><Field label="Colonnes"><select className="h-8 rounded-lg border bg-background px-2 text-sm" value={b.columns} onChange={(e) => onChange({ columns: Number(e.target.value) as ImageGalleryBlock['columns'] })}><option value="2">2</option><option value="3">3</option></select></Field></section>
  }
  return null
}

