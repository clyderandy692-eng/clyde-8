import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Storefront } from '@/components/clyde/public/storefront'
import { DEMO_BUSINESSES } from '@/lib/clyde/demo-data'
import { categoryLabel } from '@/lib/clyde/taxonomy'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return DEMO_BUSINESSES.map((business) => ({ slug: business.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const business = DEMO_BUSINESSES.find((b) => b.slug === slug)

  if (!business) {
    return { title: 'Page introuvable — CLYDE' }
  }

  const place = [business.neighborhood, business.city].filter(Boolean).join(', ')
  const description =
    business.description ??
    `${categoryLabel(business.category)}${place ? ` à ${place}` : ''}. Commandez directement sur WhatsApp.`

  return {
    title: `${business.name} — ${categoryLabel(business.category)}`,
    description,
    openGraph: {
      title: business.name,
      description,
      type: 'website',
    },
  }
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = await params
  return (
    <Suspense fallback={<main className="min-h-dvh bg-background" />}>
      <Storefront slug={slug} />
    </Suspense>
  )
}
