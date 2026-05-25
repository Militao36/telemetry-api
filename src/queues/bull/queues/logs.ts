import Bull from 'bull';
import { QueueInterface } from '../queue.interface.js';
import { ClickHouseClient } from '@clickhouse/client';
import { NormalizedLog } from '../utils/normalizeLog.js';

export class LogJobProcessor implements QueueInterface {
  clickHouseClient: ClickHouseClient

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async handle(
    job: Bull.Job<{
      logs: NormalizedLog[]
      idEmpresa: string
      idProject: string
    }>
  ): Promise<void> {
    const { logs, idEmpresa, idProject } = job.data

    const values = logs.map(log => ({
      ...log,
      id_empresa: log.id_empresa || idEmpresa,
      project_id: log.project_id || idProject,
      attributes: typeof log.attributes === 'string' ? log.attributes : JSON.stringify(log.attributes),
    }))

    await this.clickHouseClient.insert({
      table: 'telemetry.logs',
      values,
      format: 'JSONEachRow',
    })
  }
}
