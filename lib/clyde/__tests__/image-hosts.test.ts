import { describe, expect, it } from 'vitest'
import { isOptimizableImage } from '@/components/clyde/photo'
import {
  OPTIMIZED_IMAGE_HOSTS,
  remoteImagePatterns,
} from '../image-hosts.mjs'

/*
 * Cette règle décide si une image passe par l'optimiseur de Next ou par une
 * balise simple. Se tromper ne produit pas une erreur visible en développement :
 * l'optimiseur répond 400 sur un hôte non déclaré, et la photo devient un cadre
 * vide — en production seulement, chez le commerçant, sur sa propre vitrine.
 */
describe('images optimisables', () => {
  it('accepte les fichiers servis par l’application', () => {
    expect(isOptimizableImage('/placeholder.svg')).toBe(true)
    expect(isOptimizableImage('/brands/whatsapp.svg')).toBe(true)
  })

  it('accepte un hôte déclaré dans la configuration', () => {
    expect(
      isOptimizableImage(`https://${OPTIMIZED_IMAGE_HOSTS[0]}/photo.jpg`),
    ).toBe(true)
  })

  /* Régression : c'est le cas qui cassait la vitrine. Les blocs de page
     passaient ces URL à `next/image`, alors qu'un commerçant héberge ses photos
     où il veut. */
  it('refuse un hôte que le commerçant a choisi lui-même', () => {
    expect(isOptimizableImage('https://images.unsplash.com/photo.jpg')).toBe(false)
    expect(isOptimizableImage('https://mon-site-perso.cm/vitrine.png')).toBe(false)
  })

  /* Un sous-domaine voisin n'est pas l'hôte autorisé : la comparaison porte sur
     le nom d'hôte entier, pas sur un fragment. */
  it('ne se laisse pas tromper par un nom d’hôte qui contient le bon', () => {
    const host = OPTIMIZED_IMAGE_HOSTS[0]
    expect(isOptimizableImage(`https://${host}.attaquant.com/x.jpg`)).toBe(false)
    expect(isOptimizableImage(`https://prefixe-${host}/x.jpg`)).toBe(false)
  })

  it('renvoie les aperçus locaux vers la balise simple', () => {
    /* `data:` et `blob:` sont déjà en mémoire du navigateur : les faire
       retraverser le réseau n'aurait aucun sens. */
    expect(isOptimizableImage('data:image/png;base64,iVBORw0KGgo=')).toBe(false)
    expect(isOptimizableImage('blob:http://localhost/abc-123')).toBe(false)
  })

  it('ne jette jamais sur une URL malformée', () => {
    expect(() => isOptimizableImage('https://')).not.toThrow()
    expect(isOptimizableImage('https://')).toBe(false)
  })

  it('expose la même liste à la configuration de Next', () => {
    /* Le garde-fou du fichier : si les deux sources divergeaient, l'optimiseur
       et le composant ne seraient plus d'accord sur ce qui est autorisé. */
    expect(remoteImagePatterns.map((p) => p.hostname)).toEqual([
      ...OPTIMIZED_IMAGE_HOSTS,
    ])
    expect(remoteImagePatterns.every((p) => p.protocol === 'https')).toBe(true)
  })
})
