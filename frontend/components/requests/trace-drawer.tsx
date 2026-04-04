'use client'

import useSWR from 'swr'
import { X, GitBranch } from 'lucide-react'
import { api } from '@/lib/api'
import { LoadingState } from '@/components/ui/spinner'
import { httpMethodBg, statusBg, formatNs } from '@/lib/utils'

interface Props {
  traceId: string
  onClose: () => void
  source?: 'requests' | 'queries'
}

export function TraceDrawer({ traceId, onClose, source = 'requests' }: Props) {
  const { data, isLoading } = useSWR(
    ['trace', traceId, source],
    () => source === 'queries' ? api.queries.traces(traceId) : api.requests.traces(traceId),
    { revalidateOnFocus: false }
  )

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0d0d0d] border-l border-[#1a1a1a] z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#3b82f6]" />
            <div>
              <p className="text-sm font-medium text-[#ededed]">Trace</p>
              <p className="text-xs font-mono text-[#555555]">{traceId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#888888] hover:text-[#ededed] hover:bg-[#1a1a1a] transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <LoadingState />}
          {data && data.length === 0 && (
            <p className="text-sm text-[#555555] text-center py-10">Nenhum span encontrado para este trace</p>
          )}
          {data && data.length > 0 && (
            <div className="space-y-2">
              {data.map((span: any, i: number) => (
                <div
                  key={i}
                  className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {span.httpMethod && (
                      <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${httpMethodBg(span.httpMethod)}`}>
                        {span.httpMethod}
                      </span>
                    )}
                    <span className="font-mono text-sm text-[#ededed] flex-1 truncate">
                      {span.httpTarget || span.name || span.dbStatement?.slice(0, 60)}
                    </span>
                    {span.httpStatus && (
                      <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${statusBg(span.httpStatus)}`}>
                        {span.httpStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[#555555] mb-0.5">Duração</p>
                      <p className="font-mono text-[#ededed]">{formatNs(span.durationNs)}</p>
                    </div>
                    <div>
                      <p className="text-[#555555] mb-0.5">Serviço</p>
                      <p className="font-mono text-[#ededed]">{span.serviceName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[#555555] mb-0.5">Início</p>
                      <p className="font-mono text-[#888888]">{new Date(span.startTime).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-[#555555] mb-0.5">Span ID</p>
                      <p className="font-mono text-[#888888] truncate">{span.spanId?.slice(0, 12)}...</p>
                    </div>
                  </div>

                  {span.dbName && (
                    <div className="text-xs">
                      <p className="text-[#555555] mb-1">Banco / Tabela</p>
                      <p className="font-mono text-[#3b82f6]">{span.dbName}{span.dbTable ? `.${span.dbTable}` : ''}</p>
                    </div>
                  )}

                  {span.attributes && Object.keys(span.attributes).length > 0 && (
                    <details className="text-xs">
                      <summary className="text-[#555555] cursor-pointer hover:text-[#888888]">Atributos</summary>
                      <pre className="mt-2 bg-[#1a1a1a] rounded p-2 text-[#888888] overflow-x-auto text-xs leading-relaxed">
                        {JSON.stringify(span.attributes, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
