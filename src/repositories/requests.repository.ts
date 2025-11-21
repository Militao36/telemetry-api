import { ClickHouseClient } from '@clickhouse/client';

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
      SELECT *
      FROM (
          SELECT
              *,
              row_number() OVER (
                  PARTITION BY http_target
                  ORDER BY duration_ns DESC
              ) AS rnk
          FROM telemetry.spans_http
          WHERE id_empresa = '${idEmpresa}'
          ${httpMethod !== 'ALL' ? `and http_method = '${httpMethod}'` : ''}
          and start_time >= now() - toIntervalHour(${hour})
      )
      WHERE rnk = 1
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
        spanId: row.span_id,
        httpMethod: row.http_method,
        httpTarget: row.http_target,
        durationNs: row.duration_ns,
        startTime: row.start_time,
        endTime: row.end_time,
        httpStatus: row.http_status,
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
          count() AS count,
          avg(duration_ns) AS avg_ms
      FROM telemetry.spans_http
      WHERE id_empresa = '${idEmpresa}'
      and start_time >= now() - toIntervalHour(${hour})
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
}
