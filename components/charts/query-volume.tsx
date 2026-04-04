'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatTimeShort } from '@/lib/utils'

interface Props {
  data: Array<{
    interval: string
    selects: number
    inserts: number
    updates: number
    deletes: number
  }>
  height?: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-md px-3 py-2 text-xs space-y-1">
      <p className="text-[#888888] font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function QueryVolumeChart({ data, height = 200 }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    timeLabel: formatTimeShort(d.interval),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatted} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
        <XAxis
          dataKey="timeLabel"
          tick={{ fill: '#555555', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#555555', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: '#888888' }} />
        <Bar dataKey="selects" name="SELECT" stackId="a" fill="#3b82f6" fillOpacity={0.8} radius={[0, 0, 0, 0]} />
        <Bar dataKey="inserts" name="INSERT" stackId="a" fill="#22c55e" fillOpacity={0.8} />
        <Bar dataKey="updates" name="UPDATE" stackId="a" fill="#f59e0b" fillOpacity={0.8} />
        <Bar dataKey="deletes" name="DELETE" stackId="a" fill="#ef4444" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
