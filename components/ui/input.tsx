import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5',
        'placeholder:text-[#555555]',
        'focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6]',
        'w-full',
        className
      )}
      {...props}
    />
  )
}
