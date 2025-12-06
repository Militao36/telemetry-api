import { TracesService } from './services/trace.service';

import { createContainer, asClass, asValue } from 'awilix';
import axios from 'axios'
import { clientClickHouse } from './databases/clickhouse';
import { queueLogs, queueTraces } from './queues/bull';
import { TraceJobProcessor } from './queues/bull/queues/traces';
import { normalizeOTLP } from './queues/bull/utils/normalizeOtlpHttpJsonTrace';
import { logger } from './config/logger';
import { clientRedis } from './databases/redis';
import { normalizeLog } from './queues/bull/utils/normalizeLog';
import { DashService } from './services/dash.service';
import { DashRepository } from './repositories/dash.repository';
import { QueriesService } from './services/queries.service';
import { QueriesRepository } from './repositories/queries.repository';
import { RequestsRepository } from './repositories/requests.repository';
import { RequestsService } from './services/requests.service';
import { databaseKnex } from './databases/knex';
import { ProjectService } from './services/project.service';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { ProjectsRepository } from './repositories/projects.repository';
import { HashService } from './services/hash.service';
import { SearchService } from './services/search.service';
import { LogService } from './services/log.service';
import { LogsRepository } from './repositories/logs.repository';

const container = createContainer();

container.register({
  // utils
  logger: asValue(logger),
  hashService: asClass(HashService).singleton(),
  axios: asValue(axios),

  // database
  clickHouseClient: asValue(clientClickHouse),
  clientRedis: asValue(clientRedis),
  databaseKnex: asValue(databaseKnex),

  // services
  traceService: asClass(TracesService).singleton(),
  dashService: asClass(DashService).singleton(),
  queriesService: asClass(QueriesService).singleton(),
  requestsService: asClass(RequestsService).singleton(),
  projectService: asClass(ProjectService).singleton(),
  userService: asClass(UserService).singleton(),
  searchService: asClass(SearchService).singleton(),
  logService: asClass(LogService).singleton(),

  // repositories
  dashRepository: asClass(DashRepository).singleton(),
  queriesRepository: asClass(QueriesRepository).singleton(),
  requestsRepository: asClass(RequestsRepository).singleton(),
  userRepository: asClass(UserRepository).singleton(),
  projectsRepository: asClass(ProjectsRepository).singleton(),
  logsRepository: asClass(LogsRepository).singleton(),

  // queues - processors
  traceJobProcessor: asClass(TraceJobProcessor).singleton(),
  queueTraces: asValue(queueTraces),
  normalizeOTLP: asValue(normalizeOTLP),
  normalizeLog: asValue(normalizeLog),
  queueLogs: asValue(queueLogs),
});

export { container };
