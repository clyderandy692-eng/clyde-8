import { describe, expect, it } from 'vitest'
import {
  discardDraft,
  effectiveLayout,
  effectiveTheme,
  hasPendingDraft,
  publishDraft,
} from '../page-draft'
import type { Block, Page, PageTheme } from '../types'

const theme = (radius: number): PageTheme =>
  ({ radius } as unknown as PageTheme)

const block = (id: string): Block => ({ id, type: 'contact' } as unknown as Block)

/** Page en ligne sans brouillon : l'état d'un commerçant qui vient de publier. */
function livePage(): Page {
  return {
    id: 'p1',
    business_id: 'b1',
    published: true,
    layout_json: [block('a'), block('b')],
    theme_json: theme(8),
    draft_layout_json: null,
    draft_theme_json: null,
  } as unknown as Page
}

describe('effectiveLayout / effectiveTheme', () => {
  it("renvoie la version en ligne quand aucun brouillon n'existe", () => {
    const page = livePage()
    expect(effectiveLayout(page)).toBe(page.layout_json)
    expect(effectiveTheme(page)).toBe(page.theme_json)
  })

  it('renvoie le brouillon dès qu’il existe', () => {
    const draft = [block('b'), block('a')]
    const page = { ...livePage(), draft_layout_json: draft, draft_theme_json: theme(24) }
    expect(effectiveLayout(page)).toBe(draft)
    expect(effectiveTheme(page).radius).toBe(24)
  })

  /* Régression : un brouillon de mise en page seul ne doit pas entraîner le
     thème avec lui. Les deux champs sont indépendants, et retomber sur le
     thème en ligne est le comportement attendu tant qu'il n'a pas été touché. */
  it('ne mélange pas un brouillon de mise en page et le thème en ligne', () => {
    const page = { ...livePage(), draft_layout_json: [block('b')] }
    expect(effectiveLayout(page)).toHaveLength(1)
    expect(effectiveTheme(page)).toBe(page.theme_json)
  })

  /* Régression : un tableau VIDE est un brouillon légitime — le commerçant a
     retiré tous ses blocs. Un `||` à la place du `??` ferait réapparaître la
     page en ligne et rendrait la suppression du dernier bloc impossible. */
  it('respecte un brouillon vide au lieu de retomber sur la page en ligne', () => {
    const page = { ...livePage(), draft_layout_json: [] }
    expect(effectiveLayout(page)).toHaveLength(0)
  })
})

describe('hasPendingDraft', () => {
  it('est faux sur une page sans brouillon', () => {
    expect(hasPendingDraft(livePage())).toBe(false)
  })

  it('est vrai quand le brouillon diffère de la page en ligne', () => {
    const page = { ...livePage(), draft_layout_json: [block('b'), block('a')] }
    expect(hasPendingDraft(page)).toBe(true)
  })

  it('est vrai quand seul le thème diffère', () => {
    const page = { ...livePage(), draft_theme_json: theme(24) }
    expect(hasPendingDraft(page)).toBe(true)
  })

  /* Régression : le commerçant déplace un bloc puis annule son geste. Le
     brouillon existe mais son contenu est identique à la page en ligne.
     Annoncer des « modifications non publiées » l'enverrait republier une page
     inchangée, et lui apprendrait à ne plus croire l'avertissement. */
  it('est faux quand un brouillon existe mais reproduit la page en ligne', () => {
    const page = livePage()
    const identique = {
      ...page,
      draft_layout_json: JSON.parse(JSON.stringify(page.layout_json)) as Block[],
      draft_theme_json: JSON.parse(JSON.stringify(page.theme_json)) as PageTheme,
    }
    expect(hasPendingDraft(identique)).toBe(false)
  })
})

describe('publishDraft', () => {
  it('fond le brouillon dans la page en ligne et referme le brouillon', () => {
    const page = {
      ...livePage(),
      draft_layout_json: [block('b')],
      draft_theme_json: theme(24),
    }
    const published = publishDraft(page)

    expect(published.layout_json).toHaveLength(1)
    expect(published.theme_json.radius).toBe(24)
    expect(published.draft_layout_json).toBeNull()
    expect(published.draft_theme_json).toBeNull()
    expect(published.published).toBe(true)
    /* Plus rien à publier juste après une publication. */
    expect(hasPendingDraft(published)).toBe(false)
  })

  /* Régression : publier une page qui n'a pas de brouillon ne doit rien
     effacer. C'est le cas de la première mise en ligne, où le bouton publie ce
     qui est déjà dans `layout_json`. */
  it('laisse la page intacte quand il n’y a pas de brouillon', () => {
    const page = livePage()
    const published = publishDraft(page)
    expect(published.layout_json).toEqual(page.layout_json)
    expect(published.theme_json).toEqual(page.theme_json)
  })

  /* Régression : publier un brouillon de mise en page ne doit pas écraser le
     thème en ligne par autre chose que lui-même. */
  it('conserve le thème en ligne quand seul la mise en page a un brouillon', () => {
    const page = { ...livePage(), draft_layout_json: [block('b')] }
    expect(publishDraft(page).theme_json).toBe(page.theme_json)
  })
})

describe('discardDraft', () => {
  it('ramène la page à ce qui est en ligne', () => {
    const page = {
      ...livePage(),
      draft_layout_json: [block('b')],
      draft_theme_json: theme(24),
    }
    const back = discardDraft(page)

    expect(back.draft_layout_json).toBeNull()
    expect(back.draft_theme_json).toBeNull()
    expect(effectiveLayout(back)).toBe(page.layout_json)
    expect(hasPendingDraft(back)).toBe(false)
  })

  /* Régression : abandonner un brouillon ne dépublie pas la page. Le
     commerçant renonce à des modifications, pas à sa présence en ligne. */
  it('ne touche pas à l’état de publication', () => {
    const page = { ...livePage(), draft_layout_json: [block('b')] }
    expect(discardDraft(page).published).toBe(true)
    expect(discardDraft({ ...page, published: false }).published).toBe(false)
  })
})
