import type { Block, Page, PageTheme } from './types'

/**
 * Brouillon et page en ligne.
 *
 * Le constructeur écrivait directement dans ce que le visiteur voyait : la
 * moindre expérimentation était publiée à l'instant même où elle était tentée,
 * et préparer une refonte sans la montrer était impossible. Le commerçant
 * n'avait donc pas le droit d'essayer.
 *
 * Le partage retenu est volontairement dissymétrique :
 *
 * - `layout_json` / `theme_json` restent LA PAGE EN LIGNE, inchangés de sens.
 *   La vitrine, le marketplace et tout ce qui s'adresse au public continuent de
 *   les lire sans savoir qu'un brouillon existe. C'est la garantie de fond :
 *   aucun code public ne peut afficher un brouillon par accident, même écrit
 *   par distraction, puisque le brouillon n'est pas là où il regarde.
 * - `draft_layout_json` / `draft_theme_json` sont le brouillon, et valent
 *   `null` quand il n'y en a pas.
 *
 * L'inverse — le brouillon dans `layout_json` et une copie publiée à côté —
 * aurait exigé de reprendre chaque lecture publique, en confiant à la
 * vigilance ce qui est ici confié à la structure.
 */

/** La mise en page sur laquelle le commerçant travaille. */
export function effectiveLayout(page: Page): Block[] {
  return page.draft_layout_json ?? page.layout_json
}

/** Le thème sur lequel le commerçant travaille. */
export function effectiveTheme(page: Page): PageTheme {
  return page.draft_theme_json ?? page.theme_json
}

/**
 * Le brouillon diffère-t-il réellement de la page en ligne ?
 *
 * La comparaison porte sur le CONTENU, pas sur la simple présence d'un
 * brouillon. Un commerçant qui déplace un bloc puis annule son geste revient à
 * l'identique : lui annoncer des « modifications non publiées » l'enverrait
 * republier une page qui n'a pas changé, et lui apprendrait à ne plus croire
 * l'avertissement. Le jour où il aurait vraiment quelque chose à publier, il ne
 * le verrait plus.
 */
export function hasPendingDraft(page: Page): boolean {
  if (!page.draft_layout_json && !page.draft_theme_json) return false
  return (
    JSON.stringify(effectiveLayout(page)) !== JSON.stringify(page.layout_json) ||
    JSON.stringify(effectiveTheme(page)) !== JSON.stringify(page.theme_json)
  )
}

/**
 * Fond le brouillon dans la page en ligne et referme le brouillon.
 *
 * Le brouillon est remis à `null` et non conservé en copie : le garder
 * laisserait deux vérités identiques côte à côte, dont l'une se périmerait à la
 * modification suivante sans que rien ne l'indique.
 */
export function publishDraft(page: Page): Page {
  return {
    ...page,
    layout_json: effectiveLayout(page),
    theme_json: effectiveTheme(page),
    draft_layout_json: null,
    draft_theme_json: null,
    published: true,
  }
}

/** Jette le brouillon : la page revient exactement à ce qui est en ligne. */
export function discardDraft(page: Page): Page {
  return { ...page, draft_layout_json: null, draft_theme_json: null }
}
