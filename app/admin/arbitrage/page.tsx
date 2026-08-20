import type { Metadata } from 'next'
import { AdminModeration } from '@/components/clyde/admin/moderation'

export const metadata: Metadata = { title: 'Arbitrage | CLYDE Admin' }
export default function AdminArbitrationPage() {
  return <main className="mx-auto min-h-dvh max-w-6xl px-4 py-8 md:px-8"><AdminModeration /></main>
}
