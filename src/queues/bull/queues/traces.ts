import Bull from 'bull';
import { NormalizedSpanDatabase, NormalizedSpanHttp } from '../utils/normalizeOtlpHttpJsonTrace.js';
import { QueueInterface } from '../queue.interface.js';
import { ClickHouseClient } from '@clickhouse/client';

export interface TraceJobData {
  spans_http: NormalizedSpanHttp[],
  spans_database: NormalizedSpanDatabase[]
}

export class TraceJobProcessor implements QueueInterface {
  clickHouseClient: ClickHouseClient

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async handle(job: Bull.Job<TraceJobData>): Promise<void> {
    const { spans_database, spans_http } = job.data as TraceJobData;

    if (spans_database.length) {
      await this.clickHouseClient.insert({
        table: 'telemetry.spans_http',
        values: spans_database,
        format: 'JSONEachRow'
      });
    } else if (spans_http.length) {
      await this.clickHouseClient.insert({
        table: 'telemetry.spans_database',
        values: spans_http,
        format: 'JSONEachRow'
      });
    }
  }

  private toEnumKind(kind: string): string {
    // Bate com o Enum8 da migration:
    // 'UNSPECIFIED'=0, 'INTERNAL'=1, 'SERVER'=2, 'CLIENT'=3, 'PRODUCER'=4, 'CONSUMER'=5
    const valid = new Set(['UNSPECIFIED', 'INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER']);
    return valid.has(kind) ? kind : 'UNSPECIFIED';
  }

  private padHex(s: string | undefined, len: number): string {
    const v = (s || '').toLowerCase().replace(/[^0-9a-f]/g, '');
    if (v.length >= len) return v.slice(0, len);
    return v.padStart(len, '0');
  }

  private toUInt8Status(code: number | string | undefined): number {
    // OpenTelemetry: UNSET=0, OK=1, ERROR=2
    if (typeof code === 'number') return Math.max(0, Math.min(2, code));
    if (typeof code === 'string') {
      const c = code.toUpperCase();
      if (c === 'OK') return 1;
      if (c === 'ERROR') return 2;
      return 0;
    }
    return 0;
  }

  private toDateTime64String(d: Date): string {
    const msEpoch = d.getTime();
    const yyyy = d.getUTCFullYear();
    const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const HH = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    const remainderMs = msEpoch % 1000;
    const nanos = Math.round(remainderMs * 1e6); // ms -> ns
    const frac = String(nanos).padStart(9, '0');
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}.${frac}`;
  }

  private extractHttpFromArray(attributes: any[]): { method: string | null; status: number | null } {
    if (!Array.isArray(attributes)) return { method: null, status: null };

    let method: string | null = null;
    let status: number | null = null;

    for (const attr of attributes) {
      if (!attr?.key || !attr?.value) continue;

      if (attr.key === "http.method" && attr.value.stringValue !== undefined) {
        method = attr.value.stringValue;
      }

      if (attr.key === "http.status_code") {
        if (attr.value.intValue !== undefined) {
          status = Number(attr.value.intValue);
        }
        if (attr.value.doubleValue !== undefined) {
          status = Number(attr.value.doubleValue);
        }
      }
    }

    return { method, status };
  }
}