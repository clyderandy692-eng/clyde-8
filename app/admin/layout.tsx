import { AdminShell } from '@/components/clyde/admin/shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
