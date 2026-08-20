import { remoteImagePatterns } from './lib/clyde/image-hosts.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    /* Même source que le composant `Photo`, qui décide au rendu si une URL peut
       être optimisée. Deux listes séparées se seraient désynchronisées, et
       l'écart ne se voit qu'en production, sur une image vide. */
    remotePatterns: remoteImagePatterns,
  },
  /* Durcissement de base du site déployé. Pas de X-Frame-Options : les
     vitrines publiques (/r/…) sont faites pour être partagées et intégrées.
     Pas de CSP stricte tant que les médias externes (blob storage) ne sont
     pas inventoriés — une CSP trop serrée casserait le site en production. */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
