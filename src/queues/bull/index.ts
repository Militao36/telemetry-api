import Queue from 'bull'
import { container } from '../../container';
import { TraceJobProcessor } from './queues/traces';
import { clientClickHouse } from '../../databases/clickhouse';


const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}

export const queueTraces = new Queue('traces', {
  redis: REDIS_CONFIG,
})

const traceJobProcessor = new TraceJobProcessor({
  clickHouseClient: clientClickHouse
});

queueTraces.process(traceJobProcessor.handle.bind(traceJobProcessor));
