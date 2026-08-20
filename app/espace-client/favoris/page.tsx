import type { Metadata } from 'next'
import { ClientSpace } from '@/components/clyde/customer/client-space'

export const metadata: Metadata = { title: 'Mes favoris | CLYDE' }
export default function ClientFavoritesPage() { return <ClientSpace /> }
