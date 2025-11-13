import Bull from 'bull';
import { NormalizedSpan } from '../utils/normalizeOtlpHttpJsonTrace.js';
import { QueueInterface } from '../queue.interface.js';
import { ClickHouseClient } from '@clickhouse/client';

export interface TraceJobData {
  spans: NormalizedSpan[];
  idEmpresa: string;
}

export class TraceJobProcessor implements QueueInterface {
  clickHouseClient: ClickHouseClient

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async handle(job: Bull.Job<TraceJobData>): Promise<void> {
    const { spans, idEmpresa } = job.data as TraceJobData;

    if (!spans.length) return;

    const rows = spans.map((span) => {
      const trace_id = this.padHex(span.trace_id, 32);
      const span_id = this.padHex(span.span_id, 16);
      const parent_span_id = this.padHex(span.parent_span_id || '', 16) || '0000000000000000';

      const { method, status } = this.extractHttpFromArray(JSON.parse(span.attributes || '{}'));

      return {
        id_empresa: idEmpresa,
        service_name: span.service_name || 'unknown',
        service_version: span.service_version ?? null,
        service_environment: span.service_environment ?? null,

        trace_id,
        span_id,
        parent_span_id,

        name: span.name || '',
        kind: this.toEnumKind(span.kind ? String(span.kind) : 'UNSPECIFIED'),

        start_time: this.toDateTime64String(new Date(span.start_time)),
        end_time: this.toDateTime64String(new Date(span.end_time)),
        duration_ns: Number.isFinite(span.duration_ns) ? span.duration_ns : 0,

        status_code: this.toUInt8Status(span.status_code),
        status_message: span.status_message || '',

        http_method: method,
        http_status: Number.isFinite(status) && (status || 0) >= 0 ? status : 0,
        http_target: span.http_target || '',
        http_route: span.http_route || '',

        db_system: span.db_system || '',
        db_statement: span.db_statement || '',
        db_duration: span.db_duration ?? 0,

        attributes: span.attributes,

      };
    });

    await this.clickHouseClient.insert({
      table: 'telemetry.spans_raw',
      values: rows,
      format: 'JSONEachRow'
    });
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