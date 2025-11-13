import Queue from 'bull'
import { container } from '../../container';
import { TraceJobProcessor } from './queues/traces';
import { clientClickHouse } from '../../databases/clickhouse';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../../env';


const REDIS_CONFIG = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
}

export const queueTraces = new Queue('traces', {
  redis: REDIS_CONFIG,
})

const traceJobProcessor = new TraceJobProcessor({
  clickHouseClient: clientClickHouse
});

queueTraces.process(traceJobProcessor.handle.bind(traceJobProcessor));
