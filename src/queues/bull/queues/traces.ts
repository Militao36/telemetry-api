import Bull from 'bull';
import { NormalizedSpanDatabase, NormalizedSpanHttp } from '../utils/normalizeOtlpHttpJsonTrace.js';
import { QueueInterface } from '../queue.interface.js';
import { Knex } from 'knex';

export interface TraceJobData {
  spans_http: NormalizedSpanHttp[],
  spans_database: NormalizedSpanDatabase[]
}

export class TraceJobProcessor implements QueueInterface {
  database: Knex

  constructor({ database }) {
    this.database = database;
  }

  async handle(job: Bull.Job<TraceJobData>): Promise<void> {
    const { spans_database, spans_http } = job.data as TraceJobData;
    
    if (spans_database.length) {
      await this.database.table('spans_database').insert(spans_database);
    }

    if (spans_http.length) {
      await this.database.table('spans_http').insert(spans_http);
    }
  }
}