import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-2.5 py-1 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-[#3b82f6] text-white hover:bg-[#2563eb]',
        variant === 'ghost' && 'text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a]',
        variant === 'outline' && 'border border-[#222222] text-[#ededed] hover:bg-[#1a1a1a]',
        variant === 'danger' && 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.2)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
