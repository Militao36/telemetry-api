'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatTimeShort, formatMs } from '@/lib/utils'

interface Props {
  data: Array<{ time: string; totalRequests: number; avgMs: number }>
  height?: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-md px-3 py-2 text-xs space-y-1">
      <p className="text-[#888888] font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.dataKey === 'avgMs' ? formatMs(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function RequestTimeSeries({ data, height = 200 }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    timeLabel: formatTimeShort(d.time),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
        <XAxis
          dataKey="timeLabel"
          tick={{ fill: '#555555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#555555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#555555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          hide
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: 11, color: '#888888' }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="totalRequests"
          name="Requisições"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#gradRequests)"
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="avgMs"
          name="Tempo médio (ms)"
          stroke="#f59e0b"
          strokeWidth={1.5}
          fill="url(#gradAvg)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
