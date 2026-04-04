import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-[#222222] border-t-[#3b82f6]',
        className
      )}
      role="status"
      aria-label="Carregando"
    />
  )
}

export function LoadingState({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-[#888888]">
      <Spinner className="h-5 w-5" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

export function EmptyState({ message = 'Nenhum dado encontrado' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-[#555555] text-sm">
      {message}
    </div>
  )
}
