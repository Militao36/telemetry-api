'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LoadingState, EmptyState } from '@/components/ui/spinner'
import { TraceDrawer } from '@/components/requests/trace-drawer'
import { httpMethodBg, statusBg, formatNs, formatMs } from '@/lib/utils'
import { Search, Filter } from 'lucide-react'

const HTTP_METHODS = ['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function HttpFilters({ filters, onChange }: { filters: any; onChange: (f: any) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs text-[#555555] mb-1.5">Método HTTP</label>
        <Select
          value={filters.httpMethod || ''}
          onChange={(e) => onChange({ ...filters, httpMethod: e.target.value })}
        >
          <option value="">Todos</option>
          {HTTP_METHODS.filter(Boolean).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
      </div>
      <div>
        <label className="block text-xs text-[#555555] mb-1.5">Status Code</label>
        <input
          type="number"
          value={filters.statusCode || ''}
          onChange={(e) => onChange({ ...filters, statusCode: e.target.value })}
          placeholder="Ex: 500"
          className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>
      <div>
        <label className="block text-xs text-[#555555] mb-1.5">Path contém</label>
        <input
          value={filters.pathContains || ''}
          onChange={(e) => onChange({ ...filters, pathContains: e.target.value })}
          placeholder="Ex: /users"
          className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>
    </div>
  )
}

function DbFilters({ filters, onChange }: { filters: any; onChange: (f: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-[#555555] mb-1.5">Query contém</label>
        <input
          value={filters.queryContains || ''}
          onChange={(e) => onChange({ ...filters, queryContains: e.target.value })}
          placeholder="Ex: SELECT * FROM users"
          className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>
      <div>
        <label className="block text-xs text-[#555555] mb-1.5">Nome da tabela</label>
        <input
          value={filters.tableName || ''}
          onChange={(e) => onChange({ ...filters, tableName: e.target.value })}
          placeholder="Ex: users"
          className="w-full bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>
    </div>
  )
}

export default function SearchPage() {
  const [type, setType] = useState<'HTTP' | 'DATABASE'>('HTTP')
  const [traceId, setTraceId] = useState('')
  const [environment, setEnvironment] = useState('')
  const [httpFilters, setHttpFilters] = useState<any>({})
  const [dbFilters, setDbFilters] = useState<any>({})
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null)

  async function handleSearch() {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { type }
      if (traceId) params.traceId = traceId
      if (environment) params.environment = environment

      if (type === 'HTTP') {
        if (httpFilters.httpMethod) params.httpMethod = httpFilters.httpMethod
        if (httpFilters.statusCode) params.statusCode = httpFilters.statusCode
        if (httpFilters.pathContains) params.pathContains = httpFilters.pathContains
      } else {
        if (dbFilters.queryContains) params.queryContains = dbFilters.queryContains
        if (dbFilters.tableName) params.tableName = dbFilters.tableName
        if (dbFilters.dbName) params.dbName = dbFilters.dbName
      }

      const data = await api.search.list(params)
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Busca Avançada"
        description="Pesquise spans HTTP e queries de banco de dados com filtros detalhados"
      />

      <div className="p-6 space-y-4">
        {/* Filter Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#3b82f6]" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type selector */}
            <div className="flex gap-3 items-center">
              <div>
                <label className="block text-xs text-[#555555] mb-1.5">Tipo de dado</label>
                <div className="flex bg-[#0a0a0a] border border-[#222222] rounded-md p-0.5">
                  {(['HTTP', 'DATABASE'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                        type === t
                          ? 'bg-[#1a1a1a] text-[#ededed]'
                          : 'text-[#888888] hover:text-[#ededed]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#555555] mb-1.5">Trace ID</label>
                <input
                  value={traceId}
                  onChange={(e) => setTraceId(e.target.value)}
                  placeholder="trace_id exato..."
                  className="bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] w-52"
                />
              </div>

              <div>
                <label className="block text-xs text-[#555555] mb-1.5">Ambiente</label>
                <input
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="production, staging..."
                  className="bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] w-44"
                />
              </div>
            </div>

            {/* Type-specific filters */}
            {type === 'HTTP' ? (
              <HttpFilters filters={httpFilters} onChange={setHttpFilters} />
            ) : (
              <DbFilters filters={dbFilters} onChange={setDbFilters} />
            )}

            <div className="flex justify-end">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {error && (
              <p className="text-xs text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] rounded px-3 py-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results !== null && (
          <Card>
            <CardHeader>
              <CardTitle>
                Resultados
                {type === 'HTTP' ? ' — Spans HTTP' : ' — Queries de BD'}
              </CardTitle>
              <span className="text-xs text-[#555555]">{results.length} resultados</span>
            </CardHeader>
            <CardContent className="p-0">
              {loading && <LoadingState />}
              {!loading && results.length === 0 && <EmptyState />}
              {!loading && results.length > 0 && type === 'HTTP' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Método</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Caminho</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Serviço</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Duração</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Início</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Trace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {results.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${httpMethodBg(r.httpMethod)}`}>
                              {r.httpMethod}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[#888888] max-w-[220px] truncate" title={r.httpTarget}>{r.httpTarget}</td>
                          <td className="px-4 py-2.5">
                            <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${statusBg(r.httpStatus)}`}>
                              {r.httpStatus}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#888888]">{r.serviceName || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#ededed]">{formatNs(r.durationNs)}</td>
                          <td className="px-4 py-2.5 text-right text-[#555555]">
                            {new Date(r.startTime).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {r.traceId && (
                              <button
                                onClick={() => setSelectedTrace(r.traceId)}
                                className="font-mono text-[#3b82f6] hover:text-[#2563eb] text-xs"
                              >
                                {r.traceId.slice(0, 8)}...
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && results.length > 0 && type === 'DATABASE' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Query</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Tabela</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Banco</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Duração</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Início</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Trace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {results.map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-4 py-2.5 max-w-xs">
                            <span className="font-mono text-[#888888] truncate block" title={r.dbStatement}>
                              {r.dbStatement?.slice(0, 70)}{r.dbStatement?.length > 70 ? '...' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[#3b82f6]">{r.dbTable || '-'}</td>
                          <td className="px-4 py-2.5 font-mono text-[#888888]">{r.dbName || '-'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-[#ededed]">{formatMs(r.durationNs / 1e6)}</td>
                          <td className="px-4 py-2.5 text-right text-[#555555]">
                            {new Date(r.startTime).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {r.traceId && (
                              <button
                                onClick={() => setSelectedTrace(r.traceId)}
                                className="font-mono text-[#3b82f6] hover:text-[#2563eb] text-xs"
                              >
                                {r.traceId.slice(0, 8)}...
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedTrace && (
        <TraceDrawer
          traceId={selectedTrace}
          source={type === 'HTTP' ? 'requests' : 'queries'}
          onClose={() => setSelectedTrace(null)}
        />
      )}
    </div>
  )
}
