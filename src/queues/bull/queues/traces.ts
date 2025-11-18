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
      const originalArray = spans_database;
      const targetLength = 1000;

      const expandedArray = Array.from({ length: targetLength }, (_, i) => originalArray[i % originalArray.length]);
      console.log(expandedArray.length);
      await this.database.table('spans_database').insert(expandedArray);
    }

    if (spans_http.length) {
      const originalArray = spans_http;
      const targetLength = 1000;

      const expandedArray = Array.from({ length: targetLength }, (_, i) => originalArray[i % originalArray.length]);

      console.log(expandedArray.length);

      await this.database.table('spans_http').insert(expandedArray);
    }
  }
}