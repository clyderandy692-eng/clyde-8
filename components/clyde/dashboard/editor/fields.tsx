/**
 * Primitives de formulaire du panneau de réglages.
 *
 * Trois modules les emploient — réglages de bloc, de style et d'identité. Les
 * garder ici évite la dépendance circulaire qui apparaîtrait si l'un des trois
 * les hébergeait et que les deux autres l'importaient.
 */

'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
