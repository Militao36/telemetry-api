'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/spinner'
import { formatMs, formatNumber, httpMethodBg, statusBg } from '@/lib/utils'
import { RequestTimeSeries } from '@/components/charts/request-time-series'
import { ArrowRight, TrendingDown } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [hour, setHour] = useState(12)

  const { data, isLoading, error } = useSWR(
    ['dashboard', hour],
    () => api.dashboard.report(hour),
    { refreshInterval: 30_000 }
  )

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Visão Geral"
        description="Métricas de performance e saúde das suas APIs"
        hour={hour}
        onHourChange={setHour}
      />

      <div className="p-6 space-y-6">
        {isLoading && <LoadingState />}
        {error && (
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg p-4 text-sm text-[#ef4444]">
            Erro ao carregar dados: {error.message}
          </div>
        )}

        {data && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Total de Requisições"
                value={formatNumber(data.totalRequests)}
              />
              <StatCard
                label="Total de Erros"
                value={formatNumber(data.totalErrors)}
                accent={data.totalErrors > 0 ? 'error' : 'success'}
                sub={data.totalRequests > 0
                  ? `${((data.totalErrors / data.totalRequests) * 100).toFixed(1)}% taxa de erro`
                  : undefined
                }
              />
              <StatCard
                label="Tempo Médio"
                value={formatMs(data.avgResponse)}
                accent={
                  Number(data.avgResponse) > 2000 ? 'error'
                  : Number(data.avgResponse) > 500 ? 'warning'
                  : 'success'
                }
              />
              <StatCard
                label="Queries no BD"
                value={formatNumber(data.totalQueries)}
              />
            </div>

            {/* Percentiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="P50" value={formatMs(data.p50Ms)} sub="Mediana" />
              <StatCard label="P90" value={formatMs(data.p90Ms)} sub="90º percentil" />
              <StatCard label="P95" value={formatMs(data.p95Ms)} sub="95º percentil" accent={Number(data.p95Ms) > 1000 ? 'warning' : 'default'} />
              <StatCard label="P99" value={formatMs(data.p99Ms)} sub="99º percentil" accent={Number(data.p99Ms) > 2000 ? 'error' : 'default'} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Requisições por Hora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.requestPerTimeSeries?.length > 0 ? (
                      <RequestTimeSeries data={data.requestPerTimeSeries} />
                    ) : (
                      <EmptyState message="Sem dados no período" />
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Top Endpoints</CardTitle>
                    <Link href="/requests" className="text-xs text-[#888888] hover:text-[#3b82f6] flex items-center gap-1">
                      Ver todos <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.topRequests?.length > 0 ? (
                      <div className="divide-y divide-[#1a1a1a]">
                        {data.topRequests.slice(0, 8).map((req: any, i: number) => (
                          <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                            <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${httpMethodBg(req.httpMethod)}`}>
                              {req.httpMethod}
                            </span>
                            <span className="flex-1 text-xs font-mono text-[#888888] truncate" title={req.path}>
                              {req.path}
                            </span>
                            <span className="text-xs font-mono text-[#ededed] shrink-0">
                              {formatNumber(req.totalRequests)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="Sem dados" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Slowest Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#f59e0b]" />
                  Requisições Mais Lentas
                </CardTitle>
                <Link href="/requests?tab=slowest" className="text-xs text-[#888888] hover:text-[#3b82f6] flex items-center gap-1">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {data.slowestRequests?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#1a1a1a]">
                          <th className="text-left px-4 py-2.5 text-[#555555] font-medium">Método</th>
                          <th className="text-left px-4 py-2.5 text-[#555555] font-medium">Caminho</th>
                          <th className="text-right px-4 py-2.5 text-[#555555] font-medium">Duração</th>
                          <th className="text-right px-4 py-2.5 text-[#555555] font-medium">Início</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {data.slowestRequests.map((req: any, i: number) => (
                          <tr key={i} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="px-4 py-2.5">
                              <span className={`font-mono font-medium px-1.5 py-0.5 rounded ${httpMethodBg(req.httpMethod)}`}>
                                {req.httpMethod}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[#888888] max-w-xs truncate">
                              {req.path}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              <span className="text-[#f59e0b]">{formatMs(req.durationMs)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-[#555555]">
                              {new Date(req.startTime).toLocaleTimeString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="Nenhuma requisição lenta encontrada" />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
