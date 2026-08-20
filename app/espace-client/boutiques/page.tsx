import type { Metadata } from 'next'
import { ClientSpace } from '@/components/clyde/customer/client-space'

export const metadata: Metadata = { title: 'Mes boutiques | CLYDE' }
export default function ClientShopsPage() { return <ClientSpace /> }
