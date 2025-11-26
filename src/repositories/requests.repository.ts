import { ClickHouseClient } from '@clickhouse/client';
import { SearchFilters } from '../services/search.service';

export class RequestsRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  public async recentRequests(idEmpresa: string, hour: number, httpMethod: string = 'ALL'): Promise<any> {
    const query = `
      SELECT
         *
      FROM telemetry.spans_http
      WHERE id_empresa = '${idEmpresa}'
      ${httpMethod !== 'ALL' ? `and http_method = '${httpMethod}'` : ''}
      and start_time >= now() - toIntervalHour(${hour})
      ORDER BY start_time DESC
      LIMIT 10;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => ({
      traceId: row.trace_id,
      spanId: row.span_id,
      parentSpanId: row.parent_span_id,
      serviceName: row.service_name,
      serviceVersion: row.service_version,
      serviceEnvironment: row.service_environment,
      kind: row.kind,
      name: row.name,
      startTime: row.start_time,
      endTime: row.end_time,
      durationNs: row.duration_ns,
      httpUrl: row.http_url,
      httpMethod: row.http_method,
      httpTarget: row.http_target,
      httpStatus: row.http_status,
      attributes: row.attributes,
      ingestionTime: row.ingestion_time,
    }));
  }

  public async getSlowestRequests(idEmpresa: string, hour: number, httpMethod: string = 'ALL'): Promise<any[]> {
    const query = `
      SELECT
          argMaxMerge(trace_id) AS trace_id,
          argMaxMerge(span_id) AS span_id,
          argMaxMerge(duration_ns) AS duration_ns,
          argMaxMerge(start_time) AS start_time,
          argMaxMerge(end_time) AS end_time,
          argMaxMerge(http_status) AS http_status,
          argMaxMerge(service_name) AS service_name,
          http_target,
          http_method

      FROM telemetry.spans_http_slowest_by_target
      FINAL

      WHERE id_empresa = '${idEmpresa}'
      ${httpMethod !== 'ALL' ? `and http_method = '${httpMethod}'` : ''}
      and latest_start_time >= now() - toIntervalHour(${hour})

      GROUP BY
          http_target,
          http_method

      ORDER BY duration_ns DESC
      LIMIT 10;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        traceId: row.trace_id,
        spanId: row.span_id,
        httpMethod: row.http_method,
        httpTarget: row.http_target,
        durationNs: row.duration_ns,
        startTime: row.start_time,
        endTime: row.end_time,
        httpStatus: row.http_status,
        serviceName: row.service_name,
      };
    });
  }

  public async getTraces(idEmpresa: string, traceId: string): Promise<any> {
    const query = `
      SELECT
         *
      FROM telemetry.spans_http
      WHERE id_empresa = '${idEmpresa}'
      AND trace_id = '${traceId}'
      or parent_span_id = '${traceId}'
      or span_id = '${traceId}';
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => ({
      traceId: row.trace_id,
      spanId: row.span_id,
      parentSpanId: row.parent_span_id,
      serviceName: row.service_name,
      serviceVersion: row.service_version,
      serviceEnvironment: row.service_environment,
      kind: row.kind,
      name: row.name,
      startTime: row.start_time,
      endTime: row.end_time,
      durationNs: row.duration_ns,
      httpUrl: row.http_url,
      httpMethod: row.http_method,
      httpTarget: row.http_target,
      httpStatus: row.http_status,
      attributes: row.attributes,
      ingestionTime: row.ingestion_time,
    }));
  }

  public async getResponseStatusDistribution(idEmpresa: string, hour: number, httpMethod: string = 'ALL'): Promise<any[]> {
    const query = `
      SELECT
          http_status,
          countMerge(request_count) as count,
          avgMerge(avg_duration) as avg_ms
      FROM telemetry.spans_http_metrics_by_minute
      WHERE id_empresa = '${idEmpresa}'
      and time_bucket >= now() - toIntervalHour(${hour})
       ${httpMethod !== 'ALL' ? `and http_method = '${httpMethod}'` : ''}
      GROUP BY http_status
      ORDER BY count DESC;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        httpStatus: row.http_status,
        count: row.count,
        avgMs: row.avg_ms,
      };
    });
  }

  public async list(idEmpresa: string, filters: SearchFilters): Promise<any[]> {
    const where: string[] = [];

    if (filters.httpFilter?.method) {
      where.push(`http_method = '${filters.httpFilter.method}'`);
    }

    if (filters.httpFilter?.statusCode) {
      where.push(`http_status = ${filters.httpFilter.statusCode}`);
    }

    if (filters.httpFilter?.pathContains) {
      where.push(`http_target ILIKE '%${filters.httpFilter.pathContains}%'`);
    }

    if (filters.environment) {
      where.push(`service_environment = '${filters.environment}'`);
    }

    if (filters.traceId) {
      where.push(`trace_id = '${filters.traceId}'`);
    }

    if (filters.startTimeFrom) {
      where.push(`start_time >= parseDateTime64BestEffort('${filters.startTimeFrom}')`);
    }

    if (filters.startTimeTo) {
      where.push(`start_time <= parseDateTime64BestEffort('${filters.startTimeTo}')`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT
        *
      FROM telemetry.spans_http
      ${whereClause}
      ${where.length ? 'AND' : 'WHERE'} id_empresa = '${idEmpresa}'
      ORDER BY start_time DESC
      LIMIT ${filters.limit ?? 20}
      OFFSET ${filters.offset ?? 0}
    `;

    const result = await this.clickHouseClient.query({ query, format: 'JSONEachRow' });

    const rows = (await result.json()) as any;

    return rows.map((row: any) => ({
      traceId: row.trace_id,
      spanId: row.span_id,
      parentSpanId: row.parent_span_id,
      serviceName: row.service_name,
      serviceVersion: row.service_version,
      serviceEnvironment: row.service_environment,
      kind: row.kind,
      name: row.name,
      startTime: row.start_time,
      endTime: row.end_time,
      durationNs: row.duration_ns,
      httpUrl: row.http_url,
      httpMethod: row.http_method,
      httpTarget: row.http_target,
      httpStatus: row.http_status,
      attributes: row.attributes,
      ingestionTime: row.ingestion_time,
    }));
  }
}
