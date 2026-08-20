import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Storefront } from '@/components/clyde/public/storefront'
import {
  DEMO_AVAILABILITY,
  DEMO_BUSINESSES,
  DEMO_LOCATIONS,
  DEMO_PAGES,
  DEMO_PRODUCTS,
} from '@/lib/clyde/demo-data'
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
  const business = DEMO_BUSINESSES.find((candidate) => candidate.slug === slug)
  if (!business) notFound()

  const page = DEMO_PAGES.find((candidate) => candidate.business_id === business.id)
  if (!page) notFound()

  const products = DEMO_PRODUCTS.filter(
    (product) => product.business_id === business.id && product.active,
  )
  const locations = DEMO_LOCATIONS.filter((location) => location.business_id === business.id)
  const availability = DEMO_AVAILABILITY.filter((rule) => rule.business_id === business.id)

  return (
    <Suspense fallback={<main className="min-h-dvh bg-background" />}>
      <Storefront
        slug={slug}
        initialData={{ business, page, products, locations, availability }}
      />
    </Suspense>
  )
}
