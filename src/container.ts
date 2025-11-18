import { TracesService } from "./services/trace.service";

import { createContainer, asClass, asValue } from 'awilix';
import { clientClickHouse } from "./databases/clickhouse";
import { queueLogs, queueTraces } from "./queues/bull";
import { TraceJobProcessor } from "./queues/bull/queues/traces";
import { normalizeOTLP } from "./queues/bull/utils/normalizeOtlpHttpJsonTrace";
import { logger } from "./config/logger";
import { clientRedis } from "./databases/redis";
import { normalizeLog } from "./queues/bull/utils/normalizeLog";
import { DashService } from "./services/dash.service";
import { DashRepository } from "./repositories/dash.repository";
import { QueriesService } from "./services/queries.service";
import { QueriesRepository } from "./repositories/queries.repository";
import { database } from "./databases/postgres";

const container = createContainer();

container.register({
  // utils
  logger: asValue(logger),

  // database
  clickHouseClient: asValue(clientClickHouse),
  clientRedis: asValue(clientRedis),
  database: asValue(database),

  // services
  traceService: asClass(TracesService).singleton(),
  dashService: asClass(DashService).singleton(),
  queriesService: asClass(QueriesService).singleton(),

  // repositories
  dashRepository: asClass(DashRepository).singleton(),
  queriesRepository: asClass(QueriesRepository).singleton(),

  // queues - processors
  traceJobProcessor: asClass(TraceJobProcessor).singleton(),
  queueTraces: asValue(queueTraces),
  normalizeOTLP: asValue(normalizeOTLP),
  normalizeLog: asValue(normalizeLog),
  queueLogs: asValue(queueLogs),
})

export { container }
