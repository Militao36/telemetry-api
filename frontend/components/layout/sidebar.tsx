'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowUpDown,
  FileText,
  Database,
  Search,
  Settings,
  LogOut,
  Activity,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { removeToken } from '@/lib/api'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/requests', label: 'Requisições', icon: ArrowUpDown },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/queries', label: 'Queries', icon: Database },
  { href: '/search', label: 'Buscar', icon: Search },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    removeToken()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#3b82f6] rounded flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#ededed] tracking-tight">Telemetry</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]'
                  : 'text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[#1a1a1a] space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]'
              : 'text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a]'
          )}
        >
          <Settings className="w-4 h-4" />
          Configurações
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#888888] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.05)] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
