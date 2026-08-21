import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { DEMO_ACTIVE_BUSINESS_ID } from '@/lib/clyde/demo-data'
import { useClyde, useSession } from '@/lib/clyde/store'
import type { Order, OrderStatus } from '@/lib/clyde/types'
import { FILTER_KEYS, Orders } from '../orders'

/**
 * Les commandes touchent à de l'argent réel et à un client qui attend.
 *
 * On interroge donc les RÈGLES — quelles actions restent offertes, quel statut
 * avance tout seul — et non la mise en forme. Les libellés viennent du
 * dictionnaire et doivent rester réécrivables sans casser cette suite : on
 * passe par les rôles accessibles et par l'état du store.
 */

/**
 * La confirmation affichée au commerçant, espionnée.
 *
 * C'est le seul témoin qui distingue « le statut n'a pas changé » de « le code
 * a réécrit la même valeur ». Sans lui, la garde qui empêche de réécrire une
 * commande déjà contactée peut être supprimée sans qu'aucun test ne rougisse.
 */
const toastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: () => undefined,
  },
}))

const BUSINESS = DEMO_ACTIVE_BUSINESS_ID

const order = (id: string, status: OrderStatus, name: string): Order => ({
  id,
  business_id: BUSINESS,
  customer_id: null,
  customer_name: name,
  customer_phone: '+2250700000000',
  channel: 'online',
  location_id: null,
  total_estimate: 12_000,
  status,
  note: null,
  created_at: new Date('2026-08-20T10:00:00Z').toISOString(),
})

/** Les commandes du commerce, telles qu'elles sont enregistrées. */
const stored = () =>
  useClyde.getState().orders.filter((o) => o.business_id === BUSINESS)

const statusOf = (id: string) => stored().find((o) => o.id === id)?.status

/**
 * Bascule sur l'onglet qui montre toutes les commandes.
 *
 * L'écran s'ouvre sur « en attente » — ce qui réclame une action — donc une
 * commande confirmée ou annulée n'est pas visible au premier rendu.
 *
 * L'onglet est désigné par sa POSITION dans `FILTER_KEYS`, pas par son libellé
 * (texte de dictionnaire) ni par la dernière position : « tout » est suivi de
 * « paniers abandonnés ».
 */
const showAll = async (user: ReturnType<typeof userEvent.setup>) => {
  const index = FILTER_KEYS.indexOf('all')
  await user.click(screen.getAllByRole('tab')[index])
}

/** La carte d'une commande, désignée par le nom du client qu'elle affiche. */
const card = (name: string) => {
  const titre = screen.getByRole('heading', { name })
  const article = titre.closest('article')
  if (!article) throw new Error(`carte introuvable pour ${name}`)
  return article as HTMLElement
}

beforeEach(() => {
  toastSuccess.mockClear()
  /* Sans `userId`, `useOwnerContext` retombe sur le commerce de démonstration :
     c'est le chemin d'amorçage le plus court pour monter cette section. */
  useSession.setState({ userId: undefined, activeBusinessId: undefined })
  useClyde.setState({
    orders: [
      order('o-attente', 'pending', 'Awa Traoré'),
      order('o-ouverte', 'whatsapp_opened', 'Bakary Coulibaly'),
      order('o-confirmee', 'confirmed', 'Célestine Kouassi'),
      order('o-annulee', 'cancelled', 'Doumbia Salif'),
    ],
    orderItems: [],
  })
})

describe('Commandes — actions offertes selon le statut', () => {
  /* Une commande close est un dossier réglé. Lui laisser « Confirmer » ou
     « Annuler » invite à contredire une décision déjà communiquée au client. */
  it('n’offre plus d’action sur une commande confirmée ou annulée', async () => {
    const user = userEvent.setup()
    render(<Orders />)
    await showAll(user)

    expect(within(card('Célestine Kouassi')).queryAllByRole('button')).toHaveLength(0)
    expect(within(card('Doumbia Salif')).queryAllByRole('button')).toHaveLength(0)
  })

  it('offre les actions sur une commande encore ouverte', async () => {
    const user = userEvent.setup()
    render(<Orders />)
    await showAll(user)

    /* En attente comme déjà contactée : dans les deux cas le client attend une
       réponse, donc les deux issues restent atteignables. */
    expect(within(card('Awa Traoré')).queryAllByRole('button').length).toBeGreaterThan(0)
    expect(
      within(card('Bakary Coulibaly')).queryAllByRole('button').length,
    ).toBeGreaterThan(0)
  })
})

describe('Commandes — le statut suit ce que le commerçant a fait', () => {
  /* Ouvrir la discussion EST une trace : sans cet avancement automatique, le
     commerçant devrait consigner à la main ce qu'il vient de faire, et une
     commande déjà traitée resterait affichée comme jamais touchée. */
  it('passe une commande en attente à « contactée » quand on ouvre WhatsApp', async () => {
    const user = userEvent.setup()
    render(<Orders />)

    await user.click(within(card('Awa Traoré')).getByRole('link'))

    await waitFor(() => expect(statusOf('o-attente')).toBe('whatsapp_opened'))
  })

  /* Régression : l'avancement ne vaut que depuis `pending`.
     On observe la CONFIRMATION, pas le statut : réécrire `whatsapp_opened` en
     `whatsapp_opened` laisse le statut identique, donc une assertion sur le
     statut seul est tautologique — elle passait même en supprimant la garde.
     Une commande déjà contactée ne doit annoncer aucun changement. */
  it('n’annonce aucun changement sur une commande déjà contactée', async () => {
    const user = userEvent.setup()
    render(<Orders />)
    await showAll(user)

    await user.click(within(card('Bakary Coulibaly')).getByRole('link'))

    expect(statusOf('o-ouverte')).toBe('whatsapp_opened')
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  /* Le pendant du cas ci-dessus : depuis `pending`, l'avancement DOIT être
     annoncé. Sans ce cas, une garde trop stricte (qui ne ferait jamais rien)
     passerait le test de régression sans que rien ne le signale. */
  it('annonce le changement quand la commande était en attente', async () => {
    const user = userEvent.setup()
    render(<Orders />)

    await user.click(within(card('Awa Traoré')).getByRole('link'))

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1))
  })

  it('confirme une commande', async () => {
    const user = userEvent.setup()
    render(<Orders />)

    const boutons = within(card('Awa Traoré')).getAllByRole('button')
    await user.click(boutons[0])

    await waitFor(() => expect(statusOf('o-attente')).toBe('confirmed'))
  })

  /* Régression : une action ne concerne QUE sa commande. Un `onStatus` branché
     sur la mauvaise entrée passerait tous les autres tests de cette suite. */
  it('ne touche pas aux autres commandes', async () => {
    const user = userEvent.setup()
    render(<Orders />)

    const boutons = within(card('Awa Traoré')).getAllByRole('button')
    await user.click(boutons[0])

    await waitFor(() => expect(statusOf('o-attente')).toBe('confirmed'))
    expect(statusOf('o-ouverte')).toBe('whatsapp_opened')
    expect(statusOf('o-confirmee')).toBe('confirmed')
    expect(statusOf('o-annulee')).toBe('cancelled')
  })
})
