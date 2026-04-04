'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { api, setToken, setProjectId } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.auth.login(email, password)
      setToken(data.token)

      // Busca o primeiro projeto disponível
      try {
        const projects = await (async () => {
          const res = await fetch('/api/backend/projects', {
            headers: { Authorization: `Bearer ${data.token}` },
          })
          return res.json()
        })()
        if (projects?.[0]?.id) {
          setProjectId(projects[0].id)
        }
      } catch {}

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-[#ededed]">Telemetry</span>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
          <h1 className="text-base font-semibold text-[#ededed] mb-1">Entrar na sua conta</h1>
          <p className="text-xs text-[#888888] mb-6">Monitore suas APIs em tempo real</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#888888] mb-1.5" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-2 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#888888] mb-1.5" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-2 pr-10 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888] transition-colors"
                  aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-md px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#555555] mt-4">
          Plataforma de Observabilidade · OpenTelemetry + ClickHouse
        </p>
      </div>
    </div>
  )
}
