import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMs(ms: number | string): string {
  const n = Number(ms)
  if (n >= 1000) return `${(n / 1000).toFixed(2)}s`
  if (n >= 1) return `${n.toFixed(1)}ms`
  return `${(n * 1000).toFixed(0)}µs`
}

export function formatNs(ns: number | string): string {
  const n = Number(ns)
  return formatMs(n / 1_000_000)
}

export function httpMethodColor(method: string): string {
  switch (method?.toUpperCase()) {
    case 'GET': return 'text-[#22c55e]'
    case 'POST': return 'text-[#3b82f6]'
    case 'PUT': return 'text-[#f59e0b]'
    case 'PATCH': return 'text-[#8b5cf6]'
    case 'DELETE': return 'text-[#ef4444]'
    default: return 'text-[#888888]'
  }
}

export function httpMethodBg(method: string): string {
  switch (method?.toUpperCase()) {
    case 'GET': return 'bg-[rgba(34,197,94,0.1)] text-[#22c55e]'
    case 'POST': return 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]'
    case 'PUT': return 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
    case 'PATCH': return 'bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]'
    case 'DELETE': return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
    default: return 'bg-[rgba(136,136,136,0.1)] text-[#888888]'
  }
}

export function statusColor(status: number | string): string {
  const s = Number(status)
  if (s >= 500) return 'text-[#ef4444]'
  if (s >= 400) return 'text-[#f59e0b]'
  if (s >= 300) return 'text-[#3b82f6]'
  if (s >= 200) return 'text-[#22c55e]'
  return 'text-[#888888]'
}

export function statusBg(status: number | string): string {
  const s = Number(status)
  if (s >= 500) return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
  if (s >= 400) return 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
  if (s >= 300) return 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]'
  if (s >= 200) return 'bg-[rgba(34,197,94,0.1)] text-[#22c55e]'
  return 'bg-[rgba(136,136,136,0.1)] text-[#888888]'
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatTimeShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatNumber(n: number | string): string {
  const num = Number(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}
