'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatMs } from '@/lib/utils'

interface Props {
  data: Array<{ httpStatus: number; count: number; avgMs: number }>
  height?: number
}

function getStatusColor(status: number): string {
  if (status >= 500) return '#ef4444'
  if (status >= 400) return '#f59e0b'
  if (status >= 300) return '#3b82f6'
  return '#22c55e'
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-md px-3 py-2 text-xs space-y-1">
      <p className="text-[#888888]">Status {label}</p>
      <p className="text-[#ededed]">Requisições: <span className="font-semibold">{payload[0]?.value}</span></p>
      {payload[1] && (
        <p className="text-[#ededed]">Tempo médio: <span className="font-semibold">{formatMs(payload[1].value)}</span></p>
      )}
    </div>
  )
}

export function StatusDistribution({ data, height = 200 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
        <XAxis
          dataKey="httpStatus"
          tick={{ fill: '#555555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#555555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Requisições" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getStatusColor(entry.httpStatus)} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
