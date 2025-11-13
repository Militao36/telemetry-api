import { ClickHouseClient } from "@clickhouse/client";
import { TracesService } from "./services/trace.service";

import { createContainer, asClass, asValue } from 'awilix';
import { clientClickHouse } from "./databases/clickhouse";
import { queueTraces } from "./queues/bull";
import { TraceJobProcessor } from "./queues/bull/queues/traces";
import { normalizeOTLP } from "./queues/bull/utils/normalizeOtlpHttpJsonTrace";

const container = createContainer();

container.register({
  // database
  clickHouseClient: asValue(clientClickHouse),

  // services
  traceService: asClass(TracesService).singleton(),
  
  // queues - processors
  traceJobProcessor: asClass(TraceJobProcessor).singleton(),
  queueTraces: asValue(queueTraces),
  normalizeOTLP: asValue(normalizeOTLP),
})

export { container }
