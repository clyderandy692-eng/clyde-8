import type { Metadata } from 'next'
import { AdminFormationStats } from '@/components/clyde/admin/formation-stats'

export const metadata: Metadata = { title: 'Formations | CLYDE Admin' }
export default function AdminTrainingPage() {
  return <main className="mx-auto min-h-dvh max-w-6xl px-4 py-8 md:px-8"><AdminFormationStats /></main>
}
