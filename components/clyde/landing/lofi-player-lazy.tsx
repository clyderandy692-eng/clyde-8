'use client'

import dynamic from 'next/dynamic'

/**
 * Chargement différé du lecteur d'ambiance.
 *
 * Le lecteur n'est ni visible ni utile au premier écran : c'est une commande
 * flottante en bas de page, que le visiteur atteint après avoir fait défiler.
 * Le laisser dans le paquet initial de l'accueil retardait l'affichage du titre
 * pour du JavaScript dont personne n'a besoin dans la première seconde.
 *
 * `ssr: false` demande une enveloppe marquée `'use client'` : l'accueil est un
 * composant serveur, et Next refuse d'y désactiver le rendu serveur. D'où ce
 * fichier, qui n'existe que pour porter la directive.
 *
 * Aucun substitut de chargement n'est prévu : une pastille fantôme dans un coin
 * attirerait l'œil sans rien annoncer.
 */
const Player = dynamic(() => import('./lofi-player').then((m) => m.LofiPlayer), {
  ssr: false,
})

export function LofiPlayerLazy() {
  return <Player />
}
