'use client'

import { useState, Suspense } from 'react'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/spinner'
import { RequestTimeSeries } from '@/components/charts/request-time-series'
import { StatusDistribution } from '@/components/charts/status-distribution'
import { TraceDrawer } from '@/components/requests/trace-drawer'
import { formatNs, formatMs, httpMethodBg, statusBg, formatDateTime } from '@/lib/utils'

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const TABS = [
  { id: 'recent', label: 'Recentes' },
  { id: 'slowest', label: 'Mais Lentas' },
  { id: 'metrics', label: 'Métricas' },
]

function RequestsContent() {
  const searchParams = useSearchParams()
  const [hour, setHour] = useState(12)
  const [method, setMethod] = useState('ALL')
  const [tab, setTab] = useState(searchParams.get('tab') || 'recent')
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null)

  const recentKey = tab === 'recent' ? ['requests-recent', hour, method] : null
  const slowestKey = tab === 'slowest' ? ['requests-slowest', hour, method] : null
  const metricsKey = tab === 'metrics' ? ['requests-metrics', hour, method] : null

  const { data: recentData, isLoading: loadingRecent } = useSWR(
    recentKey,
    () => api.requests.recent(hour, method),
    { refreshInterval: 30_000 }
  )

  const { data: slowestData, isLoading: loadingSlowest } = useSWR(
    slowestKey,
    () => api.requests.slowest(hour, method),
    { refreshInterval: 60_000 }
  )

  const { data: metricsData, isLoading: loadingMetrics } = useSWR(
    metricsKey,
    () => api.requests.metrics(hour, method),
    { refreshInterval: 30_000 }
  )

  const isLoading = loadingRecent || loadingSlowest || loadingMetrics

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Requisições HTTP"
        description="Explore e analise as requisições HTTP da sua API"
        hour={hour}
        onHourChange={setHour}
      />

      <div className="p-6 space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-[#111111] border border-[#222222] rounded-md p-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-[#1a1a1a] text-[#ededed]'
                    : 'text-[#888888] hover:text-[#ededed]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>{m === 'ALL' ? 'Todos os métodos' : m}</option>
            ))}
          </Select>
        </div>

        {/* Recent Tab */}
        {tab === 'recent' && (
          <Card>
            <CardHeader>
              <CardTitle>Requisições Recentes</CardTitle>
              <span className="text-xs text-[#555555]">{recentData?.length || 0} resultados</span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRecent && <LoadingState />}
              {!loadingRecent && (!recentData || recentData.length === 0) && <EmptyState />}
              {recentData && recentData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Método</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Caminho</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Serviço</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Duração</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Horário</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Trace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {recentData.map((req: any, i: number) => (
                        <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-4 py-3">
                            <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${httpMethodBg(req.httpMethod)}`}>
                              {req.httpMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[#888888] max-w-[260px] truncate" title={req.httpTarget}>
                            {req.httpTarget}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${statusBg(req.httpStatus)}`}>
                              {req.httpStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#888888]">{req.serviceName || '-'}</td>
                          <td className="px-4 py-3 text-right font-mono text-[#ededed]">
                            {formatNs(req.durationNs)}
                          </td>
                          <td className="px-4 py-3 text-right text-[#555555]">
                            {new Date(req.startTime).toLocaleTimeString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {req.traceId && (
                              <button
                                onClick={() => setSelectedTrace(req.traceId)}
                                className="font-mono text-[#3b82f6] hover:text-[#2563eb] text-xs truncate max-w-[80px] block ml-auto"
                                title={req.traceId}
                              >
                                {req.traceId.slice(0, 8)}...
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

        {/* Slowest Tab */}
        {tab === 'slowest' && (
          <Card>
            <CardHeader>
              <CardTitle>Requisições Mais Lentas</CardTitle>
              <span className="text-xs text-[#555555]">{slowestData?.length || 0} resultados</span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSlowest && <LoadingState />}
              {!loadingSlowest && (!slowestData || slowestData.length === 0) && <EmptyState />}
              {slowestData && slowestData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Método</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Endpoint</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-[#555555] font-medium">Serviço</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Duração</th>
                        <th className="text-right px-4 py-3 text-[#555555] font-medium">Trace</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {slowestData.map((req: any, i: number) => (
                        <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="px-4 py-3">
                            <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${httpMethodBg(req.httpMethod)}`}>
                              {req.httpMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[#888888] max-w-[260px] truncate">
                            {req.httpTarget}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${statusBg(req.httpStatus)}`}>
                              {req.httpStatus || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#888888]">{req.serviceName || '-'}</td>
                          <td className="px-4 py-3 text-right font-mono text-[#f59e0b] font-medium">
                            {formatNs(req.durationNs)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {req.traceId && (
                              <button
                                onClick={() => setSelectedTrace(req.traceId)}
                                className="font-mono text-[#3b82f6] hover:text-[#2563eb] text-xs"
                              >
                                {req.traceId.slice(0, 8)}...
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

        {/* Metrics Tab */}
        {tab === 'metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Requisições por Hora</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMetrics && <LoadingState />}
                {metricsData?.requestPerTimeSeries?.length > 0 ? (
                  <RequestTimeSeries data={metricsData.requestPerTimeSeries} />
                ) : !loadingMetrics ? (
                  <EmptyState />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status HTTP</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMetrics && <LoadingState />}
                {metricsData?.responseStatusDistribution?.length > 0 ? (
                  <StatusDistribution data={metricsData.responseStatusDistribution} />
                ) : !loadingMetrics ? (
                  <EmptyState />
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {selectedTrace && (
        <TraceDrawer
          traceId={selectedTrace}
          onClose={() => setSelectedTrace(null)}
        />
      )}
    </div>
  )
}

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsContent />
    </Suspense>
  )
}
