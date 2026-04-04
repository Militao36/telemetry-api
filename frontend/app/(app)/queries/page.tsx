'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { LoadingState, EmptyState } from '@/components/ui/spinner'
import { QueryVolumeChart } from '@/components/charts/query-volume'
import { TraceDrawer } from '@/components/requests/trace-drawer'
import { formatMs, formatNumber } from '@/lib/utils'
import { Database } from 'lucide-react'

const QUERY_TYPES = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'select', label: 'SELECT' },
  { value: 'insert', label: 'INSERT' },
  { value: 'update', label: 'UPDATE' },
  { value: 'del', label: 'DELETE' },
]

function queryTypeBg(type: string): string {
  switch (type?.toLowerCase()) {
    case 'select': return 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]'
    case 'insert': return 'bg-[rgba(34,197,94,0.1)] text-[#22c55e]'
    case 'update': return 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]'
    case 'del':
    case 'delete': return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
    default: return 'bg-[rgba(136,136,136,0.1)] text-[#888888]'
  }
}

function inferQueryType(stmt: string): string {
  if (!stmt) return '?'
  const s = stmt.trim().toLowerCase()
  if (s.startsWith('select')) return 'SELECT'
  if (s.startsWith('insert')) return 'INSERT'
  if (s.startsWith('update')) return 'UPDATE'
  if (s.startsWith('delete') || s.startsWith('del')) return 'DELETE'
  return 'SQL'
}

export default function QueriesPage() {
  const [hour, setHour] = useState(12)
  const [queryTy, setQueryTy] = useState('all')
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'select' | 'insert' | 'update' | 'del'>('select')

  const { data, isLoading } = useSWR(
    ['queries-report', hour, queryTy],
    () => api.queries.list(hour, queryTy),
    { refreshInterval: 60_000 }
  )

  const metrics = data?.metrics
  const currentSlowest = {
    select: data?.slowesTypeSelect,
    insert: data?.slowesTypeInsert,
    update: data?.slowesTypeUpdate,
    del: data?.slowesTypeDelete,
  }[activeSection]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Queries de Banco de Dados"
        description="Análise de performance das queries SQL monitoradas"
        hour={hour}
        onHourChange={setHour}
        actions={
          <Select value={queryTy} onChange={(e) => setQueryTy(e.target.value)}>
            {QUERY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        }
      />

      <div className="p-6 space-y-5">
        {isLoading && <LoadingState />}

        {data && (
          <>
            {/* Metrics */}
            {metrics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Total de Queries" value={formatNumber(metrics.totalQueries)} />
                <StatCard label="Tempo Médio" value={formatMs(metrics.avgMs)} accent={Number(metrics.avgMs) > 500 ? 'warning' : 'default'} />
                <StatCard label="P95" value={formatMs(metrics.p95Ms)} accent={Number(metrics.p95Ms) > 1000 ? 'warning' : 'default'} />
                <StatCard label="P99" value={formatMs(metrics.p99Ms)} accent={Number(metrics.p99Ms) > 2000 ? 'error' : 'default'} />
              </div>
            )}

            {/* Volume Chart */}
            {data.queryVolumeByHours?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Volume de Queries por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <QueryVolumeChart data={data.queryVolumeByHours} />
                </CardContent>
              </Card>
            )}

            {/* Query Type Distribution */}
            {data.queryVolumeByType?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#1a1a1a]">
                    {data.queryVolumeByType.map((qt: any, i: number) => {
                      const pct = data.queryVolumeByType.reduce((s: number, q: any) => s + Number(q.total), 0)
                      const barWidth = ((Number(qt.total) / pct) * 100).toFixed(1)
                      return (
                        <div key={i} className="px-4 py-3 flex items-center gap-4">
                          <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded w-20 text-center ${queryTypeBg(qt.queryType)}`}>
                            {qt.queryType?.toUpperCase()}
                          </span>
                          <div className="flex-1 bg-[#1a1a1a] rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-[#3b82f6]"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-[#ededed] w-16 text-right">{formatNumber(qt.total)}</span>
                          <span className="text-xs text-[#555555] w-12 text-right">{barWidth}%</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Slowest Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#f59e0b]" />
                  Queries Mais Lentas
                </CardTitle>
                <div className="flex bg-[#0a0a0a] border border-[#222222] rounded p-0.5">
                  {(['select', 'insert', 'update', 'del'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveSection(t)}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                        activeSection === t
                          ? 'bg-[#1a1a1a] text-[#ededed]'
                          : 'text-[#555555] hover:text-[#888888]'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!currentSlowest || currentSlowest.length === 0 ? (
                  <EmptyState message="Nenhuma query encontrada" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#1a1a1a]">
                          <th className="text-left px-4 py-3 text-[#555555] font-medium">Query</th>
                          <th className="text-left px-4 py-3 text-[#555555] font-medium">Tabela</th>
                          <th className="text-right px-4 py-3 text-[#555555] font-medium">Execuções</th>
                          <th className="text-right px-4 py-3 text-[#555555] font-medium">Média</th>
                          <th className="text-right px-4 py-3 text-[#555555] font-medium">Máximo</th>
                          <th className="text-right px-4 py-3 text-[#555555] font-medium">Trace</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {currentSlowest.map((q: any, i: number) => {
                          const qtype = inferQueryType(q.dbStatement)
                          return (
                            <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                              <td className="px-4 py-3 max-w-xs">
                                <div className="flex items-start gap-2">
                                  <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded shrink-0 ${queryTypeBg(qtype)}`}>
                                    {qtype}
                                  </span>
                                  <span className="font-mono text-[#888888] truncate" title={q.dbStatement}>
                                    {q.dbStatement?.slice(0, 60)}{q.dbStatement?.length > 60 ? '...' : ''}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-[#3b82f6]">{q.dbTable || '-'}</td>
                              <td className="px-4 py-3 text-right font-mono text-[#ededed]">{formatNumber(q.executions)}</td>
                              <td className="px-4 py-3 text-right font-mono text-[#ededed]">{formatMs(q.avgDurationMs)}</td>
                              <td className="px-4 py-3 text-right font-mono text-[#f59e0b] font-medium">{formatMs(q.durationMs)}</td>
                              <td className="px-4 py-3 text-right">
                                {q.traceId && (
                                  <button
                                    onClick={() => setSelectedTrace(q.traceId)}
                                    className="font-mono text-[#3b82f6] hover:text-[#2563eb] text-xs"
                                  >
                                    {q.traceId.slice(0, 8)}...
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedTrace && (
        <TraceDrawer
          traceId={selectedTrace}
          source="queries"
          onClose={() => setSelectedTrace(null)}
        />
      )}
    </div>
  )
}
