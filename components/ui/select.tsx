'use client'

import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5',
        'focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6]',
        'appearance-none cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
