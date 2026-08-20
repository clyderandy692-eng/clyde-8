/**
 * Le constructeur affiche-t-il encore ses blocs ?
 *
 * `blocks.tsx` faisait 2 600 lignes et pesait quinze types de blocs dans un
 * seul fichier ; il vit maintenant dans dix-sept modules. Le contrôle de types
 * garantit que les imports se résolvent, mais pas qu'un bloc produise encore
 * quelque chose à l'écran — un `RenderCtx` mal câblé, une primitive partagée
 * partie dans le mauvais module, et le bloc disparaît en silence.
 *
 * D'où un test dirigé par `BLOCK_LIBRARY` plutôt que par une liste écrite à la
 * main : ajouter un seizième type de bloc sans lui donner de rendu fait échouer
 * la suite, au lieu de passer inaperçu jusqu'à ce qu'un commerçant l'ajoute à
 * sa page.
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BLOCK_LIBRARY, DEFAULT_THEME, createBlock } from '@/lib/clyde/blocks'
import { DEMO_AVAILABILITY, DEMO_BUSINESSES, DEMO_PRODUCTS } from '@/lib/clyde/demo-data'
import { BlockRender, type RenderCtx } from '../blocks'

const business = DEMO_BUSINESSES[0]
const products = DEMO_PRODUCTS.filter((p) => p.business_id === business.id)

/**
 * Blocs qui se masquent volontairement sur la vitrine publique quand le
 * commerçant ne les a pas encore remplis.
 *
 * Ce n'est pas une régression mais une règle produit : un cadre vidéo vide ou
 * une galerie portant « Ajoutez des photos » adresse au client une consigne
 * destinée au commerçant, et décrédibilise la vitrine. Les recenser ici plutôt
 * que d'assouplir l'assertion garde le test capable de détecter la disparition
 * d'un bloc qui, lui, devrait s'afficher.
 */
const HIDDEN_WHEN_UNCONFIGURED = new Set(['video', 'image_gallery'])

/** La navigation basse est réservée au téléphone par défaut. */
const MOBILE_ONLY = new Set(['bottom_nav'])

function makeCtx(overrides: Partial<RenderCtx> = {}): RenderCtx {
  return {
    business,
    products,
    availability: DEMO_AVAILABILITY,
    theme: DEFAULT_THEME,
    currency: business.currency,
    device: 'desktop',
    interactive: true,
    search: '',
    setSearch: vi.fn(),
    category: null,
    setCategory: vi.fn(),
    ...overrides,
  }
}

/** Le bloc doit-il produire du DOM dans ce contexte ? */
function shouldRender(type: string, ctx: RenderCtx): boolean {
  if (MOBILE_ONLY.has(type) && ctx.device !== 'mobile') return false
  if (HIDDEN_WHEN_UNCONFIGURED.has(type) && ctx.interactive) return false
  return true
}

const ALL_TYPES = BLOCK_LIBRARY.map((meta) => [meta.type, meta.label] as const)

describe('BlockRender', () => {
  /* Le catalogue de blocs proposé au commerçant est la source de vérité : tout
     ce qu'il peut ajouter doit s'afficher, ou se taire pour une raison connue. */
  it.each(ALL_TYPES)('affiche le bloc « %s » (%s)', (type) => {
    const ctx = makeCtx()
    const { container } = render(<BlockRender block={createBlock(type)} ctx={ctx} />)

    if (!shouldRender(type, ctx)) {
      expect(container.firstElementChild).toBeNull()
      return
    }

    /* Un bloc rendu occupe de la place. Le seul test qui vaille ici est
       « quelque chose est arrivé dans le document » : vérifier un texte précis
       reviendrait à figer la maquette de chaque bloc. */
    expect(container.firstElementChild).not.toBeNull()
  })

  it.each(ALL_TYPES)('rend le bloc « %s » sur mobile', (type) => {
    const ctx = makeCtx({ device: 'mobile' })
    const { container } = render(<BlockRender block={createBlock(type)} ctx={ctx} />)
    expect(container.firstElementChild === null).toBe(!shouldRender(type, ctx))
  })

  /* L'aperçu du constructeur rend les mêmes blocs avec `interactive: false`.
     C'est le chemin le plus emprunté de l'application — un commerçant y passe
     tout son temps de mise en page — et chaque bloc doit y rester
     sélectionnable, y compris ceux qui se masquent en public. */
  it.each(ALL_TYPES)('garde le bloc « %s » visible dans l’aperçu', (type) => {
    const ctx = makeCtx({ interactive: false, device: 'mobile' })
    const { container } = render(<BlockRender block={createBlock(type)} ctx={ctx} />)
    expect(container.firstElementChild).not.toBeNull()
  })

  /* Une page neuve n'a pas encore de produits : c'est l'état exact dans lequel
     le commerçant découvre son constructeur. Les blocs doivent y tenir sans
     planter sur un tableau vide. */
  it.each(ALL_TYPES)('rend le bloc « %s » sans catalogue', (type) => {
    expect(() =>
      render(<BlockRender block={createBlock(type)} ctx={makeCtx({ products: [] })} />),
    ).not.toThrow()
  })

  it('respecte le masquage d’un bloc', () => {
    const block = { ...createBlock('hero'), hidden: true }
    const { container } = render(<BlockRender block={block} ctx={makeCtx()} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('affiche le titre de la couverture', () => {
    const block = createBlock('hero')
    render(<BlockRender block={block} ctx={makeCtx()} />)
    /* Un test d'ancrage : si le rendu de la couverture cesse d'afficher son
       propre titre, le découpage a cassé quelque chose de visible. */
    if ('title' in block && block.title) {
      expect(screen.getByText(block.title)).toBeTruthy()
    }
  })

  it('affiche le champ de recherche', () => {
    /* Le bloc de recherche n'a aucun texte propre — uniquement un champ. Sans
       cette assertion, le test générique le laisserait passer même vide. */
    render(<BlockRender block={createBlock('search')} ctx={makeCtx()} />)
    expect(screen.getByRole('textbox')).toBeTruthy()
  })
})
