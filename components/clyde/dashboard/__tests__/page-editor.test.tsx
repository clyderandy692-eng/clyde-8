/**
 * Le constructeur de pages, monté pour de vrai.
 *
 * C'est l'écran le plus long du projet (1040 lignes) et il n'avait aucun test
 * de rendu. Les règles qu'il applique sont couvertes ailleurs — `editor-layout`
 * pour les déplacements, `editor-session` pour l'historique, `page-draft` pour
 * le brouillon — mais rien ne vérifiait que l'écran les APPELLE. La différence
 * n'est pas théorique : une session précédente a vu des éditions de ce fichier
 * écrasées par un `git pull`, laissant le constructeur lire la page en ligne au
 * lieu du brouillon. Les 187 tests de `lib/` restaient verts. Le défaut n'a été
 * trouvé qu'à l'œil, au navigateur.
 *
 * Ces tests montent donc le composant entier et manipulent ses commandes comme
 * le commerçant le fait, en interrogeant les rôles accessibles plutôt que les
 * libellés — le texte appartient au dictionnaire et doit pouvoir être réécrit.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { createBlock } from '@/lib/clyde/blocks'
import { DEMO_ACTIVE_BUSINESS_ID } from '@/lib/clyde/demo-data'
import { useEditorSession } from '@/lib/clyde/editor-session'
import { useClyde, useSession } from '@/lib/clyde/store'
import type { Block } from '@/lib/clyde/types'
import { PageEditor } from '../page-editor'

/** Trois blocs suffisent : un premier, un milieu déplaçable, un dernier. */
const LAYOUT = (): Block[] => [
  { ...createBlock('hero'), id: 'b-hero' },
  { ...createBlock('faq'), id: 'b-faq' },
  { ...createBlock('contact'), id: 'b-contact' },
]

/**
 * Amorce l'écran sur le commerce de démonstration.
 *
 * Sans `userId`, `useOwnerContext` retombe sur ce commerce : c'est le chemin
 * que suit l'aperçu public du projet, et il évite de fabriquer une session
 * factice dont la forme divergerait de la vraie.
 */
function seed(layout: Block[] = LAYOUT(), published = true) {
  useSession.setState({ userId: null, activeBusinessId: null })
  useClyde.setState((state) => ({
    pages: state.pages.map((p) =>
      p.business_id === DEMO_ACTIVE_BUSINESS_ID
        ? { ...p, layout_json: layout, draft_layout_json: null, draft_theme_json: null, published }
        : p,
    ),
  }))
}

/** La page du commerce de démonstration, telle qu'elle est enregistrée. */
const stored = () =>
  useClyde.getState().pages.find((p) => p.business_id === DEMO_ACTIVE_BUSINESS_ID)!

/** Ce que le constructeur donne à modifier : le brouillon s'il existe. */
const working = (): Block[] => {
  const page = stored()
  return page.draft_layout_json ?? page.layout_json
}

const types = (blocks: Block[]) => blocks.map((b) => b.type)

/**
 * La liste ordonnable des blocs.
 *
 * On la désigne par les commandes qu'elle contient plutôt que par un conteneur
 * nommé : l'écran a deux colonnes et un panneau de réglages, et une requête
 * globale sur « Monter » ramènerait aussi les boutons de l'aperçu.
 */
const rows = () => screen.getAllByLabelText('Monter').map((b) => b.closest('li') ?? b.parentElement!)

/**
 * Le bandeau du brouillon, désigné par son nom accessible.
 *
 * Trois `role="status"` cohabitent sur cet écran ; une requête par rôle seul
 * en ramènerait plusieurs et le test échouerait pour la mauvaise raison.
 */
const bandeau = () => screen.getByRole('status', { name: 'Brouillon non publié' })
const pasDeBandeau = () =>
  screen.queryByRole('status', { name: 'Brouillon non publié' }) === null

beforeEach(async () => {
  useEditorSession.setState({ sessions: {} })
  await useClyde.persist.rehydrate()
  seed()
})

describe('constructeur — rendu et commandes', () => {
  it('affiche un rang par bloc de la page', async () => {
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))
  })

  it('déplace un bloc et écrit le nouvel ordre', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))

    /* Le deuxième rang : le premier a « Monter » désactivé, ce qui est
       précisément l'invariant vérifié plus bas. */
    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => expect(types(working())).toEqual(['faq', 'hero', 'contact']))
  })

  /* Régression : `move` borne l'index. Sans cette garde, monter le premier bloc
     le faisait disparaître de la liste (index -1). */
  it('interdit de monter le premier bloc et de descendre le dernier', async () => {
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))

    expect(within(rows()[0]).getByLabelText('Monter')).toBeDisabled()
    expect(within(rows()[2]).getByLabelText('Descendre')).toBeDisabled()
  })

  it('masque un bloc sans le retirer de la page', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))

    await user.click(within(rows()[0]).getByRole('switch'))

    await waitFor(() => expect(working()[0].hidden).toBe(true))
    /* Masquer n'est pas supprimer : le bloc et son contenu restent là. */
    expect(working()).toHaveLength(3)
  })

  it('rend l’annulation possible après une modification', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))

    const annuler = screen.getByLabelText('Annuler')
    expect(annuler).toBeDisabled()

    await user.click(within(rows()[1]).getByLabelText('Monter'))
    await waitFor(() => expect(screen.getByLabelText('Annuler')).toBeEnabled())

    await user.click(screen.getByLabelText('Annuler'))
    await waitFor(() => expect(types(working())).toEqual(['hero', 'faq', 'contact']))
  })
})

/**
 * Le brouillon vu depuis l'écran.
 *
 * `page-draft.test.ts` couvre les accesseurs. Ce qui manquait, et ce qui a
 * réellement cassé, c'est le branchement : que le constructeur écrive dans le
 * brouillon et non dans la page en ligne.
 */
describe('constructeur — brouillon d’une page en ligne', () => {
  it('écrit dans le brouillon et laisse la page en ligne intacte', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))

    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => expect(stored().draft_layout_json).not.toBeNull())
    expect(types(stored().draft_layout_json!)).toEqual(['faq', 'hero', 'contact'])
    /* L'invariant du chantier : ce que voient les visiteurs n'a pas bougé. */
    expect(types(stored().layout_json)).toEqual(['hero', 'faq', 'contact'])
  })

  it('annonce le brouillon en attente et propose de le publier', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))
    expect(pasDeBandeau()).toBe(true)

    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => bandeau())
    /* Un seul bouton publie, et il est dans le bandeau qui dit pourquoi. */
    expect(within(bandeau()).getAllByRole('button')).toHaveLength(2)
  })

  it('fait fondre le brouillon dans la page en ligne à la publication', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))
    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => bandeau())
    await user.click(within(bandeau()).getAllByRole('button')[1])

    await waitFor(() => expect(types(stored().layout_json)).toEqual(['faq', 'hero', 'contact']))
    expect(stored().draft_layout_json).toBeNull()
  })

  it('revient à la page en ligne quand le brouillon est abandonné', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))
    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => bandeau())
    await user.click(within(bandeau()).getAllByRole('button')[0])

    await waitFor(() => expect(stored().draft_layout_json).toBeNull())
    expect(types(stored().layout_json)).toEqual(['hero', 'faq', 'contact'])
  })

  /* Régression : l'historique décrit le brouillon qu'on vient de jeter.
     « Annuler » praticable après un abandon ferait revenir à l'écran ce que le
     commerçant venait explicitement d'abandonner. */
  it('rend l’annulation impraticable après un abandon', async () => {
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))
    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => bandeau())
    await user.click(within(bandeau()).getAllByRole('button')[0])

    await waitFor(() => expect(screen.getByLabelText('Annuler')).toBeDisabled())
  })

  /* Régression : un brouillon ne naît que sur une page DÉJÀ en ligne. Sur une
     page hors ligne il n'y a rien à protéger, et un brouillon y ajouterait une
     publication à faire pour un simple premier passage. */
  it('écrit directement dans la page quand elle n’est pas en ligne', async () => {
    seed(LAYOUT(), false)
    const user = userEvent.setup()
    render(<PageEditor />)
    await waitFor(() => expect(rows()).toHaveLength(3))

    await user.click(within(rows()[1]).getByLabelText('Monter'))

    await waitFor(() => expect(types(stored().layout_json)).toEqual(['faq', 'hero', 'contact']))
    expect(stored().draft_layout_json).toBeNull()
    expect(pasDeBandeau()).toBe(true)
  })
})
