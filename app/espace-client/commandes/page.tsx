import type { Metadata } from 'next'
import { ClientSpace } from '@/components/clyde/customer/client-space'

export const metadata: Metadata = { title: 'Mes commandes | CLYDE' }
export default function ClientOrdersPage() { return <ClientSpace /> }
