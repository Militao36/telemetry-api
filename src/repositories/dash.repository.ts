import { ClickHouseClient } from '@clickhouse/client';

export type MetricsResult = {
  totalRequests: number;
  totalErrors: number;
  avgMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
};

export class DashRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  public async getMetrics(idEmpresa: string, hour: number): Promise<MetricsResult> {
    const query = `
     SELECT
        count(*) AS total_requests,
        countIf(http_status >= 500) AS total_errors,
        avg(duration_ns) / 1e6 AS avg_ms,
        quantile(0.5)(duration_ns)  / 1e6 AS p50_ms,
        quantile(0.9)(duration_ns)  / 1e6 AS p90_ms,
        quantile(0.95)(duration_ns) / 1e6 AS p95_ms,
        quantile(0.99)(duration_ns) / 1e6 AS p99_ms
      FROM telemetry.spans_http
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    const row = rows.data[0] as any;

    return {
      totalRequests: +row.total_requests,
      totalErrors: +row.total_errors,
      avgMs: row.avg_ms,
      p50Ms: row.p50_ms,
      p90Ms: row.p90_ms,
      p95Ms: row.p95_ms,
      p99Ms: row.p99_ms,
    };
  }

  public async getTopRequests(idEmpresa: string, hour: number): Promise<any[]> {
    const query = `
      SELECT
        http_method,
        splitByChar('?', http_target)[1] AS path,
        count(*) AS total_requests,
        avg(duration_ns) / 1e6 AS avg_ms
      FROM telemetry.spans_http
      WHERE start_time >= now() - toIntervalHour(${hour})
      AND id_empresa = '${idEmpresa}'
      GROUP BY path, http_method
      ORDER BY total_requests DESC
      LIMIT 10
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        httpMethod: row.http_method,
        path: row.path,
        totalRequests: +row.total_requests,
        avgMs: row.avg_ms,
      };
    });
  }

  public async getRequestPerTimeSeries(
    idEmpresa: string,
    hour: number,
    httpMethod?: string,
  ): Promise<any[]> {
    const query = `
      SELECT
          toStartOfInterval(start_time, INTERVAL 1 HOUR) AS time,
          count(*) AS total_requests,
          avg(duration_ns) / 1e6 AS avg_ms
      FROM telemetry.spans_http
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
      ${httpMethod !== 'ALL' ? `and http_method = '${httpMethod}'` : ''}
      GROUP BY time
      ORDER BY time ASC;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        time: row.time,
        totalRequests: +row.total_requests,
        avgMs: row.avg_ms,
      };
    });
  }

  public async getSlowestRequests(idEmpresa: string, hour: number): Promise<any[]> {
    const query = `
      SELECT
          http_method,
          splitByChar('?', http_target)[1] AS path,
          duration_ns / 1e6 AS duration_ms,
          start_time,
          end_time
      FROM telemetry.spans_http
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
      ORDER BY duration_ns DESC
      LIMIT 20;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        httpMethod: row.http_method,
        path: row.path,
        durationMs: row.duration_ms,
        startTime: row.start_time,
        endTime: row.end_time,
      };
    });
  }

  public async getTotalQueries(idEmpresa: string, hour: number): Promise<number> {
    const queries = `
      SELECT
        count(*) AS total_queries
      FROM telemetry.spans_database
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
    `;

    const result = await this.clickHouseClient.query({
      query: queries,
      format: 'JSON',
    });

    const rows = await result.json();

    const row = rows.data[0] as any;

    return +row.total_queries;
  }
}
