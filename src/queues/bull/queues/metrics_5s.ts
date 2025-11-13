// import { queueMetrics5s } from '../index.js'

// queueMetrics5s.process(async (job) => {
//   try {
//     const spans = job.data.spans as Array<any>

//     const metricsMap = {} as {
//       [key: string]: {
//         endpoint: string
//         interval_start: Date
//         rps: number
//         total_latency: number
//         errors: number
//       }
//     }

//     spans.forEach((span: any) => {
//       const endpoint = span.name

//       const intervalStart = new Date(Math.floor(new Date(span.startTime).getTime() / 5000) * 5000)

//       const key = `${endpoint}_${intervalStart.toISOString()}`

//       if (!metricsMap[key]) {
//         metricsMap[key] = {
//           endpoint,
//           interval_start: intervalStart,
//           rps: 0,
//           total_latency: 0,
//           errors: 0,
//         }
//       }

//       metricsMap[key].rps += 1
//       metricsMap[key].total_latency +=
//         new Date(span.endTime).getTime() - new Date(span.startTime).getTime()
//       if (span.status !== 0) metricsMap[key].errors += 1
//     })

//     const rows = Object.values(metricsMap).map((m: any) => ({
//       endpoint: m.endpoint,
//       interval_start: m.interval_start,
//       rps: Math.round(m.rps / 5),
//       avg_latency: m.total_latency / m.rps,
//       errors: m.errors,
//     }))

//     if (rows.length === 0) return

//     await clientClickHouse.insert({
//       table: 'metrics_5s',
//       values: rows,
//     })
//   } catch (err) {
//     console.error('Error processing spans:', err)
//     throw err
//   }
// })
