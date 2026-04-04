'use client'

import { Select } from '@/components/ui/select'

interface HeaderProps {
  title: string
  description?: string
  hour?: number
  onHourChange?: (h: number) => void
  actions?: React.ReactNode
}

const HOUR_OPTIONS = [
  { value: 1, label: 'Última hora' },
  { value: 6, label: 'Últimas 6h' },
  { value: 12, label: 'Últimas 12h' },
  { value: 24, label: 'Último dia' },
  { value: 72, label: 'Últimos 3 dias' },
  { value: 168, label: 'Última semana' },
  { value: 720, label: 'Último mês' },
]

export function PageHeader({ title, description, hour, onHourChange, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
      <div>
        <h1 className="text-base font-semibold text-[#ededed]">{title}</h1>
        {description && <p className="text-xs text-[#888888] mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {onHourChange && (
          <Select
            value={String(hour)}
            onChange={(e) => onHourChange(Number(e.target.value))}
          >
            {HOUR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        )}
        {actions}
      </div>
    </div>
  )
}
