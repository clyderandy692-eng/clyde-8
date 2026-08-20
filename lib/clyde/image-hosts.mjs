/**
 * Hôtes dont les images peuvent passer par l'optimiseur de Next.
 *
 * Ce fichier est en `.mjs` pour une seule raison : `next.config.mjs` ne peut
 * pas importer de TypeScript, et cette liste doit être lue aux deux endroits.
 * La dupliquer serait le début de la fin — l'optimiseur refuse tout hôte absent
 * de `remotePatterns` avec une erreur 400, et un composant qui croirait un hôte
 * autorisé afficherait une image cassée en production, pas un avertissement.
 *
 * Les URL de médias sont saisies par les commerçants : elles peuvent pointer
 * n'importe où. C'est précisément pourquoi l'autorisation est une liste fermée
 * et non un joker — ouvrir `**` ferait de l'optimiseur un proxy d'images pour
 * tout l'internet, aux frais du projet.
 */
export const OPTIMIZED_IMAGE_HOSTS = [
  'hebbkx1anhila5yf.public.blob.vercel-storage.com',
]

/** Traduction en `images.remotePatterns` pour la configuration de Next. */
export const remoteImagePatterns = OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
  protocol: 'https',
  hostname,
}))
