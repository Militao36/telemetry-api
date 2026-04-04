'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingState, EmptyState } from '@/components/ui/spinner'
import { Search, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEVERITY_LEVELS = [
  { value: 'all', label: 'Todos os níveis', color: '#888888' },
  { value: 'DEBUG', label: 'DEBUG', color: '#888888' },
  { value: 'INFO', label: 'INFO', color: '#3b82f6' },
  { value: 'WARN', label: 'WARN', color: '#f59e0b' },
  { value: 'ERROR', label: 'ERROR', color: '#ef4444' },
  { value: 'FATAL', label: 'FATAL', color: '#dc2626' },
]

function severityColor(s: string): string {
  switch (s?.toUpperCase()) {
    case 'DEBUG': return 'text-[#888888]'
    case 'INFO': return 'text-[#3b82f6]'
    case 'WARN': return 'text-[#f59e0b]'
    case 'ERROR': return 'text-[#ef4444]'
    case 'FATAL': return 'text-[#dc2626]'
    default: return 'text-[#888888]'
  }
}

function severityBg(s: string): string {
  switch (s?.toUpperCase()) {
    case 'DEBUG': return 'bg-[rgba(136,136,136,0.1)] text-[#888888]'
    case 'INFO': return 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]'
    case 'WARN': return 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
    case 'ERROR': return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
    case 'FATAL': return 'bg-[rgba(220,38,38,0.15)] text-[#dc2626]'
    default: return 'bg-[rgba(136,136,136,0.1)] text-[#888888]'
  }
}

function LogRow({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false)
  const hasException = log.exceptionMessage || log.exceptionStacktrace

  return (
    <div className="border-b border-[#1a1a1a] last:border-0">
      <button
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[#555555] shrink-0 mt-0.5">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        <span className="text-xs text-[#555555] font-mono shrink-0 w-36">
          {new Date(log.timestamp).toLocaleString('pt-BR')}
        </span>
        <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded shrink-0 ${severityBg(log.severityText)}`}>
          {log.severityText || '?'}
        </span>
        <span className="text-xs text-[#888888] shrink-0 w-28 truncate">{log.serviceName || '-'}</span>
        <span className="flex-1 text-xs font-mono text-[#ededed] truncate">{log.message}</span>
        {hasException && (
          <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444] shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-10 pb-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-[#555555] mb-0.5">Trace ID</p>
              <p className="font-mono text-[#888888] truncate">{log.traceId || '-'}</p>
            </div>
            <div>
              <p className="text-[#555555] mb-0.5">Ambiente</p>
              <p className="font-mono text-[#ededed]">{log.environment || '-'}</p>
            </div>
            <div>
              <p className="text-[#555555] mb-0.5">Host</p>
              <p className="font-mono text-[#ededed]">{log.host || '-'}</p>
            </div>
            <div>
              <p className="text-[#555555] mb-0.5">Versão</p>
              <p className="font-mono text-[#ededed]">{log.appVersion || '-'}</p>
            </div>
          </div>

          {log.message && (
            <div className="text-xs">
              <p className="text-[#555555] mb-1">Mensagem completa</p>
              <pre className="bg-[#1a1a1a] border border-[#222222] rounded-md p-3 text-[#ededed] font-mono whitespace-pre-wrap break-all leading-relaxed">
                {log.message}
              </pre>
            </div>
          )}

          {hasException && (
            <div className="text-xs">
              <p className="text-[#ef4444] mb-1 font-medium">Exceção: {log.exceptionType}</p>
              {log.exceptionMessage && (
                <p className="text-[#888888] mb-2">{log.exceptionMessage}</p>
              )}
              {log.exceptionStacktrace && (
                <pre className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] rounded-md p-3 text-[#ef4444] font-mono text-xs overflow-x-auto leading-relaxed">
                  {log.exceptionStacktrace}
                </pre>
              )}
            </div>
          )}

          {log.attributes && Object.keys(log.attributes).length > 0 && (
            <details className="text-xs">
              <summary className="text-[#555555] cursor-pointer hover:text-[#888888]">Atributos</summary>
              <pre className="mt-2 bg-[#1a1a1a] rounded p-2 text-[#888888] overflow-x-auto text-xs leading-relaxed">
                {JSON.stringify(log.attributes, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default function LogsPage() {
  const [severity, setSeverity] = useState('all')
  const [message, setMessage] = useState('')
  const [traceId, setTraceId] = useState('')
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({})

  function handleSearch() {
    const q: Record<string, string> = {}
    if (severity !== 'all') q.severityText = severity
    if (message) q.message = message
    if (traceId) q.traceId = traceId
    setSearchQuery(q)
  }

  const { data, isLoading } = useSWR(
    ['logs', JSON.stringify(searchQuery)],
    () => api.logs.list(searchQuery),
    { refreshInterval: 30_000 }
  )

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Logs"
        description="Explore os logs coletados via OpenTelemetry"
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-[#555555] mb-1.5">Mensagem</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555555]" />
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar na mensagem..."
                    className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md pl-9 pr-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#555555] mb-1.5">Severidade</label>
                <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  {SEVERITY_LEVELS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs text-[#555555] mb-1.5">Trace ID</label>
                <input
                  value={traceId}
                  onChange={(e) => setTraceId(e.target.value)}
                  placeholder="trace_id..."
                  className="bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] w-44"
                />
              </div>

              <Button onClick={handleSearch}>
                <Search className="w-3.5 h-3.5" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
            <span className="text-xs text-[#555555]">{data?.length || 0} registros</span>
          </CardHeader>
          <CardContent className="p-0">
            {/* Table header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a1a] text-xs text-[#555555] font-medium">
              <span className="w-4"></span>
              <span className="w-36">Timestamp</span>
              <span className="w-16">Nível</span>
              <span className="w-28">Serviço</span>
              <span className="flex-1">Mensagem</span>
            </div>

            {isLoading && <LoadingState />}
            {!isLoading && (!data || data.length === 0) && <EmptyState />}
            {data && data.length > 0 && (
              <div>
                {data.map((log: any, i: number) => (
                  <LogRow key={i} log={log} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
