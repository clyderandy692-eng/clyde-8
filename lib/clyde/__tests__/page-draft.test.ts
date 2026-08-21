import { describe, expect, it } from 'vitest'
import { discardDraft, effectiveLayout, effectiveTheme, hasPendingDraft, publishDraft } from '../page-draft'
import { DEFAULT_THEME } from '../blocks'
import type { Block, Page, PageTheme } from '../types'

const bloc = (id: string): Block =>
  ({ id, type: 'faq', items: [] }) as unknown as Block

function page(patch: Partial<Page> = {}): Page {
  return {
    id: 'p1',
    business_id: 'b1',
    theme_json: DEFAULT_THEME,
    layout_json: [bloc('en-ligne')],
    draft_layout_json: null,
    draft_theme_json: null,
    published: true,
    ...patch,
  }
}

describe('page-draft — ce que lit le commerçant', () => {
  it('sans brouillon, renvoie la page en ligne', () => {
    expect(effectiveLayout(page())).toEqual([bloc('en-ligne')])
    expect(effectiveTheme(page())).toEqual(DEFAULT_THEME)
  })

  it('avec brouillon, renvoie le brouillon', () => {
    const p = page({ draft_layout_json: [bloc('brouillon')] })
    expect(effectiveLayout(p)).toEqual([bloc('brouillon')])
  })

  /* Régression : une page enregistrée avant l'existence du brouillon arrive
     sans ces champs. Elle doit se lire comme une page sans brouillon, pas
     planter ni afficher un vide. */
  it('tolère une page antérieure au brouillon', () => {
    const ancienne = { ...page(), draft_layout_json: undefined, draft_theme_json: undefined } as unknown as Page
    expect(effectiveLayout(ancienne)).toEqual([bloc('en-ligne')])
    expect(effectiveTheme(ancienne)).toEqual(DEFAULT_THEME)
    expect(hasPendingDraft(ancienne)).toBe(false)
  })
})

describe('page-draft — signaler un brouillon en attente', () => {
  it('ne signale rien sans brouillon', () => {
    expect(hasPendingDraft(page())).toBe(false)
  })

  it('signale un brouillon dont le contenu diffère', () => {
    expect(hasPendingDraft(page({ draft_layout_json: [bloc('autre')] }))).toBe(true)
  })

  it('signale un thème modifié seul', () => {
    const theme = { ...DEFAULT_THEME, accent: '#123456' } as PageTheme
    expect(hasPendingDraft(page({ draft_theme_json: theme }))).toBe(true)
  })

  /* Régression, et c'est la raison d'être de la comparaison par contenu : un
     commerçant qui déplace un bloc puis annule son geste a un brouillon dont le
     contenu est identique à la page en ligne. Lui annoncer des modifications
     non publiées l'enverrait republier une page inchangée — et lui apprendrait
     à ne plus croire l'avertissement. */
  it('ne signale rien quand le brouillon est revenu à l’identique', () => {
    const p = page({ draft_layout_json: [bloc('en-ligne')], draft_theme_json: DEFAULT_THEME })
    expect(hasPendingDraft(p)).toBe(false)
  })
})

describe('page-draft — publier et abandonner', () => {
  it('publier fond le brouillon dans la page en ligne et le referme', () => {
    const theme = { ...DEFAULT_THEME, accent: '#abcdef' } as PageTheme
    const publiee = publishDraft(page({ draft_layout_json: [bloc('nouveau')], draft_theme_json: theme }))

    expect(publiee.layout_json).toEqual([bloc('nouveau')])
    expect(publiee.theme_json).toEqual(theme)
    expect(publiee.published).toBe(true)
    /* Le brouillon ne survit pas à sa publication : deux vérités identiques
       côte à côte, dont l'une se périme sans le dire. */
    expect(publiee.draft_layout_json).toBeNull()
    expect(publiee.draft_theme_json).toBeNull()
    expect(hasPendingDraft(publiee)).toBe(false)
  })

  it('publier une page sans brouillon ne change pas ce qui est en ligne', () => {
    const avant = page()
    const apres = publishDraft(avant)
    expect(apres.layout_json).toEqual(avant.layout_json)
    expect(apres.theme_json).toEqual(avant.theme_json)
  })

  it('abandonner laisse la page en ligne intacte', () => {
    const p = page({ draft_layout_json: [bloc('jetable')] })
    const apres = discardDraft(p)

    expect(apres.layout_json).toEqual([bloc('en-ligne')])
    expect(apres.draft_layout_json).toBeNull()
    expect(hasPendingDraft(apres)).toBe(false)
  })
})
