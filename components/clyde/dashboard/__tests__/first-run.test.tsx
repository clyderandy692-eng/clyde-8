/**
 * L'accueil du tout premier passage.
 *
 * `activation.test.ts` couvre la règle — quelles étapes comptent, quand elles
 * sont acquises. Il ne dit rien de l'affichage, or c'est l'affichage qui a
 * bougé trois fois : le paramètre d'URL a divergé entre l'assistant et le
 * tableau de bord, la carte a clignoté avant l'hydratation, et la prop a changé
 * de forme.
 *
 * Quatre conditions doivent être vraies **en même temps** pour que la carte
 * paraisse. Chacune a son test, parce qu'une seule qui s'inverse produit soit
 * un accueil qui ne vient jamais, soit un accueil qui revient sans cesse.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ACTIVATION_WELCOME_KEY, FIRST_RUN_PARAM } from '@/lib/clyde/activation'
import { useClyde } from '@/lib/clyde/store'
import { FirstRunWelcome } from '../first-run'

const BUSINESS = 'biz-test'

/** Pose l'URL que l'assistant d'inscription produit en fin de parcours. */
function withParam(value: string | null) {
  const url = value === null ? '/tableau-de-bord' : `/tableau-de-bord?${FIRST_RUN_PARAM}=${value}`
  window.history.replaceState({}, '', url)
}

/**
 * Témoin de présence de la carte.
 *
 * On interroge le titre par son rôle et non par son libellé : le texte de
 * bienvenue appartient au dictionnaire et doit pouvoir être réécrit sans faire
 * échouer une suite qui teste un comportement, pas une formulation.
 */
const carte = () => screen.queryByRole('heading', { level: 2 })

/**
 * Les trois commandes de la carte, dans l'ordre du DOM.
 *
 * La croix et le bouton « plus tard » écartent tous deux l'accueil ; celui du
 * milieu emmène vers les étapes. Les distinguer par leur position évite de
 * figer leurs libellés, mais impose de vérifier leur nombre — un quatrième
 * bouton ajouté sans réflexion ferait échouer le test plutôt que de glisser
 * silencieusement.
 */
function commandes() {
  const boutons = screen.getAllByRole('button')
  expect(boutons).toHaveLength(3)
  return { croix: boutons[0], versEtapes: boutons[1], plusTard: boutons[2] }
}

beforeEach(() => {
  /* Chaque test repart d'un commerçant qui n'a rien vu ni rien fait. */
  useClyde.setState({ activationChecks: [] })
  withParam('1')
})

describe('FirstRunWelcome', () => {
  it('accueille le commerçant qui arrive de l’inscription', async () => {
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    /* `useClydeReady` passe à vrai dans un effet : la carte n'existe qu'après. */
    await waitFor(() => expect(carte()).toBeTruthy())
  })

  it('ne s’affiche pas sans le paramètre de fin d’inscription', async () => {
    /* Sans cette garde, l'accueil reviendrait à chaque visite du tableau de
       bord — c'est-à-dire tous les jours, pour toujours. */
    withParam(null)
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    await waitFor(() => expect(carte()).toBeNull())
  })

  it('ignore une valeur de paramètre autre que 1', async () => {
    withParam('0')
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    await waitFor(() => expect(carte()).toBeNull())
  })

  it('ne s’affiche plus une fois écarté', async () => {
    /* Le constat est irréversible : « cette personne a vu l'accueil » est un
       fait, pas une préférence. */
    useClyde.setState({ activationChecks: [`${BUSINESS}:${ACTIVATION_WELCOME_KEY}`] })
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    await waitFor(() => expect(carte()).toBeNull())
  })

  it('ne souhaite pas la bienvenue à un commerçant déjà activé', async () => {
    /* Cas réel : un commerçant installé qui rouvre un vieux lien d'inscription
       gardé dans son historique. */
    render(<FirstRunWelcome businessId={BUSINESS} activationDone />)
    await waitFor(() => expect(carte()).toBeNull())
  })

  it('ne produit rien au rendu serveur et n’y touche pas à window', () => {
    /*
     * Deux garanties en une, et c'est le rendu serveur qui les porte — pas le
     * rendu de test, où les effets sont déjà exécutés quand `render` retourne.
     *
     * D'abord l'absence d'écart d'hydratation : le serveur ne doit rien émettre,
     * sinon la carte clignoterait chez quelqu'un qui l'a déjà écartée. Ensuite
     * la lecture de l'URL, faite via `window.location` pour garder la page dans
     * le prérendu statique : elle se trouve après la garde d'hydratation, donc
     * ce rendu ne doit pas lever d'erreur bien que `window` n'existe pas côté
     * serveur. C'est fragile par nature, d'où ce test.
     */
    expect(
      renderToStaticMarkup(
        <FirstRunWelcome businessId={BUSINESS} activationDone={false} />,
      ),
    ).toBe('')
  })

  it('enregistre le renvoi quand on écarte la carte', async () => {
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    await waitFor(() => expect(carte()).toBeTruthy())

    commandes().plusTard.click()

    await waitFor(() => {
      expect(useClyde.getState().activationChecks).toContain(
        `${BUSINESS}:${ACTIVATION_WELCOME_KEY}`,
      )
    })
  })

  it('écarte aussi la carte en partant vers les étapes', async () => {
    /* Le bouton principal fait deux choses : il défile vers la checklist et il
       consomme l'accueil. Si le second effet disparaît, la carte revient au
       rechargement suivant. */
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    await waitFor(() => expect(carte()).toBeTruthy())

    commandes().versEtapes.click()

    await waitFor(() => {
      expect(useClyde.getState().activationChecks).toContain(
        `${BUSINESS}:${ACTIVATION_WELCOME_KEY}`,
      )
    })
  })

  it('ne mélange pas les constats de deux commerces', async () => {
    /* Les constats sont indexés par commerce : un commerçant qui gère deux
       boutiques doit être accueilli sur la seconde. */
    useClyde.setState({ activationChecks: [`autre-biz:${ACTIVATION_WELCOME_KEY}`] })
    render(<FirstRunWelcome businessId={BUSINESS} activationDone={false} />)
    await waitFor(() => expect(carte()).toBeTruthy())
  })

  it('annonce la carte sans couper la lecture du titre de page', async () => {
    const { container } = render(
      <FirstRunWelcome businessId={BUSINESS} activationDone={false} />,
    )
    await waitFor(() => expect(carte()).toBeTruthy())
    /* `polite` et non `assertive` : l'accueil arrive à l'ouverture de l'écran. */
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()
  })
})
