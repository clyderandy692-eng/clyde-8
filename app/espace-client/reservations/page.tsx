import type { Metadata } from 'next'
import { ClientSpace } from '@/components/clyde/customer/client-space'

export const metadata: Metadata = { title: 'Mes réservations | CLYDE' }
export default function ClientBookingsPage() { return <ClientSpace /> }
