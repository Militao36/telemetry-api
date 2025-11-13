import Bull from 'bull';
import { NormalizedSpan } from '../utils/normalizeOtlpHttpJsonTrace.js';
import { QueueInterface } from '../queue.interface.js';
import { ClickHouseClient } from '@clickhouse/client';
import { NormalizedLog } from '../utils/normalizeLog.js';

export class LogJobProcessor implements QueueInterface {
  clickHouseClient: ClickHouseClient

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async handle(job: Bull.Job<{ logs: NormalizedLog[] }>): Promise<void> {
    const { logs } = job.data as { logs: NormalizedLog[] };

    await this.clickHouseClient.insert({
      table: 'telemetry.logs',
      values: logs,
      format: 'JSONEachRow'
    });
  }
}