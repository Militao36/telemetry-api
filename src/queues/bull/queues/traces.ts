import Bull from 'bull';
import { NormalizedSpanDatabase, NormalizedSpanHttp } from '../utils/normalizeOtlpHttpJsonTrace.js';
import { QueueInterface } from '../queue.interface.js';
import { ClickHouseClient } from '@clickhouse/client';

export interface TraceJobData {
  spans_http: NormalizedSpanHttp[];
  spans_database: NormalizedSpanDatabase[];
}

export class TraceJobProcessor implements QueueInterface {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async handle(job: Bull.Job<TraceJobData>): Promise<void> {
    const { spans_database, spans_http } = job.data as TraceJobData;

    if (spans_database.length) {
      await this.clickHouseClient.insert({
        table: 'telemetry.spans_database',
        values: spans_database,
        format: 'JSONEachRow',
      });
    }

    if (spans_http.length) {
      await this.clickHouseClient.insert({
        table: 'telemetry.spans_http',
        values: spans_http,
        format: 'JSONEachRow',
      });
    }
  }
}
