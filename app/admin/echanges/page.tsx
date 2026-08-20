import type { Metadata } from 'next'
import { AdminFulfilment } from '@/components/clyde/admin/fulfilment'

export const metadata: Metadata = { title: 'Échanges | CLYDE Admin' }
export default function AdminExchangesPage() {
  return <main className="mx-auto min-h-dvh max-w-6xl px-4 py-8 md:px-8"><AdminFulfilment /></main>
}
