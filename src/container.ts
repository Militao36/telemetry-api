import { ClickHouseClient } from "@clickhouse/client";
import { TracesService } from "./services/trace.service";

import { createContainer, asClass, asValue } from 'awilix';
import { clientClickHouse } from "./databases/clickhouse";
import { queueTraces } from "./queues/bull";
import { TraceJobProcessor } from "./queues/bull/queues/traces";
import { normalizeOTLP } from "./queues/bull/utils/normalizeOtlpHttpJsonTrace";
import { logger } from "./config/logger";
import { clientRedis } from "./databases/redis";

const container = createContainer();

container.register({
  // utils
  logger: asValue(logger),

  // database
  clickHouseClient: asValue(clientClickHouse),
  clientRedis: asValue(clientRedis),

  // services
  traceService: asClass(TracesService).singleton(),

  // queues - processors
  traceJobProcessor: asClass(TraceJobProcessor).singleton(),
  queueTraces: asValue(queueTraces),
  normalizeOTLP: asValue(normalizeOTLP),
})

export { container }
