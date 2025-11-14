import Queue from 'bull'
import { container } from '../../container';
import { TraceJobProcessor } from './queues/traces';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../../env';
// import { LogJobProcessor } from './queues/logs';
import { clientClickHouse } from '../../databases/clickhouse';

const REDIS_CONFIG = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
}

export const queueTraces = new Queue('traces', {
  redis: REDIS_CONFIG,
})

export const queueLogs = new Queue('logs', {
  redis: REDIS_CONFIG,
})

//#region Trace Processor
const traceJobProcessor = new TraceJobProcessor({
  clickHouseClient: clientClickHouse
});

queueTraces.process(traceJobProcessor.handle.bind(traceJobProcessor));
//#endregion Trace Processor

//#region Log Processor
// const logJobProcessor = new LogJobProcessor({
//   clickHouseClient: clientClickHouse
// })

// queueLogs.process(logJobProcessor.handle.bind(logJobProcessor));
//#endregion Log Processor