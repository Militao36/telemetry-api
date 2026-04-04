import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'default' | 'error' | 'warning' | 'success'
  className?: string
}

export function StatCard({ label, value, sub, accent = 'default', className }: StatCardProps) {
  const accentMap = {
    default: 'text-[#ededed]',
    error: 'text-[#ef4444]',
    warning: 'text-[#f59e0b]',
    success: 'text-[#22c55e]',
  }

  return (
    <div className={cn('bg-[#111111] border border-[#222222] rounded-lg p-4', className)}>
      <p className="text-xs text-[#888888] uppercase tracking-wider mb-2">{label}</p>
      <p className={cn('text-2xl font-mono font-semibold', accentMap[accent])}>{value}</p>
      {sub && <p className="text-xs text-[#555555] mt-1">{sub}</p>}
    </div>
  )
}
