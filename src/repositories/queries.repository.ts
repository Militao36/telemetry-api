import { ClickHouseClient } from '@clickhouse/client';
import { SearchFilters } from '../services/search.service';
import _ from 'lodash';

export class QueriesRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  // TODO
  async avgQueryTimeByType(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'del' | 'all') {
    const query = `
      SELECT 
        count(*) AS total_queries,
        avg(duration_ns) / 1e6 AS avg_ms,
        quantile(0.5)(duration_ns)  / 1e6 AS p50_ms,
        quantile(0.9)(duration_ns)  / 1e6 AS p90_ms,
        quantile(0.95)(duration_ns) / 1e6 AS p95_ms,
        quantile(0.99)(duration_ns) / 1e6 AS p99_ms
      FROM "telemetry"."spans_database"
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      ${queryType !== 'all' ? `and db_statement like '${queryType}%'` : ''}
      and id_empresa = '${idEmpresa}'
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: 'JSON',
    });

    const result = await resultSet.json<{
      total_queries: number;
      avg_ms: number;
      p50_ms: number;
      p90_ms: number;
      p95_ms: number;
      p99_ms: number;
    }>();

    return result.data.map((item) => ({
      totalQueries: item.total_queries,
      avgMs: item.avg_ms,
      p50Ms: item.p50_ms,
      p90Ms: item.p90_ms,
      p95Ms: item.p95_ms,
      p99Ms: item.p99_ms,
    }))[0];
  }

  // TODO
  async avgQueryTimeByHour(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'del' | 'all') {
    const query = `
      SELECT 
        toStartOfInterval(start_time, INTERVAL 1 hour) AS interval_hour,
        avg(duration_ns) / 1e6 AS avg_ms,
        quantile(0.5)(duration_ns)  / 1e6 AS p50_ms,
        quantile(0.9)(duration_ns)  / 1e6 AS p90_ms,
        quantile(0.95)(duration_ns) / 1e6 AS p95_ms,
        quantile(0.99)(duration_ns) / 1e6 AS p99_ms
      FROM "telemetry"."spans_database"
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      ${queryType !== 'all' ? `and db_statement like '${queryType}%'` : ''}
      and id_empresa = '${idEmpresa}'
      GROUP BY interval_hour
      ORDER BY interval_hour ASC
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: 'JSON',
    });

    const result = await resultSet.json<{
      interval_hour: string;
      total_queries: number;
      avg_ms: number;
      p50_ms: number;
      p90_ms: number;
      p95_ms: number;
      p99_ms: number;
    }>();

    return result.data.map((item) => ({
      intervalHour: item.interval_hour,
      totalQueries: item.total_queries,
      avgMs: item.avg_ms,
      p50Ms: item.p50_ms,
      p90Ms: item.p90_ms,
      p95Ms: item.p95_ms,
      p99Ms: item.p99_ms,
    }));
  }

  async slowestQueries(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'del' | 'all', limit: number = 10) {
    const query = `
      SELECT
        db_statement,
        db_table,
        start_time,
        countMerge(execution_count) AS total_executions,
        (sumMerge(sum_duration) / total_executions) / 1000000 AS average_duration_ms,
        maxMerge(max_duration) / 1000000 AS max_duration_ms,

        argMaxMerge(slowest_trace_id) AS slowest_trace_id,
        argMaxMerge(slowest_span_id) AS slowest_span_id
      FROM
          telemetry.spans_database_slowest
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND db_statement <> '' 
      ${queryType !== 'all' ? `AND db_statement like '${queryType}%'` : ''}
      AND id_empresa = '${idEmpresa}'
      GROUP BY
          db_statement,
          db_table,
          start_time
      ORDER BY
          max_duration_ms DESC
      LIMIT 10;
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: 'JSON',
    });

    const result = await resultSet.json<{
      db_statement: string;
      db_table: string;
      total_executions: string;
      average_duration_ms: number;
      max_duration_ms: number;
      slowest_trace_id: string;
      slowest_span_id: string;
    }>();

    return result.data.map((item) => ({
      traceId: item.slowest_trace_id,
      spanId: item.slowest_span_id,
      durationMs: item.max_duration_ms,
      dbStatement: item.db_statement,
      dbTable: item.db_table,
      executions: +item.total_executions,
      avgDurationMs: item.average_duration_ms,
    }));
  }

  async queryVolumeByType(idEmpresa: string, hour: number) {
    const query = `
      SELECT
          query_type,
          countMerge(total_queries) AS total
      FROM telemetry.spans_database_hourly_summary
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      and id_empresa = '${idEmpresa}'
      GROUP BY query_type
      ORDER BY total DESC;
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: 'JSON',
    });

    const result = await resultSet.json<{ query_type: string; total: number }>();

    return result.data.map((item) => ({
      queryType: item.query_type,
      total: item.total,
    }));
  }

  async getQueryVolumeByHours(idEmpresa: string, hour: number) {
    const query = `
      SELECT
        start_time,
        id_empresa,
        query_type,

        countMerge(total_queries) AS total_queries,
        avgMerge(duration_state) AS avg_duration,

        quantileMerge(0.5)(p50_state) AS p50,
        quantileMerge(0.9)(p90_state) AS p90,
        quantileMerge(0.95)(p95_state) AS p95,
        quantileMerge(0.99)(p99_state) AS p99
      FROM telemetry.spans_database_hourly_summary
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
      GROUP BY
          start_time,
          id_empresa,
          query_type
      ORDER BY start_time DESC;
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: 'JSON',
    });

    const result = await resultSet.json();

    const grouped = {};

    for (const item of _.orderBy(result.data, 'start_time', 'asc') as any[]) {
      const interval = item.start_time;

      if (!grouped[interval]) {
        grouped[interval] = {
          interval,
          selects: 0,
          inserts: 0,
          updates: 0,
          deletes: 0,
        };
      }

      switch (item.query_type) {
        case 'SELECT':
          grouped[interval].selects += item.total_queries;
          break;
        case 'INSERT':
          grouped[interval].inserts += item.total_queries;
          break;
        case 'UPDATE':
          grouped[interval].updates += item.total_queries;
          break;
        case 'DEL':
          grouped[interval].deletes += item.total_queries;
          break;
        default:
          break;
      }
    }

    return Object.values(grouped);
  }

  public async getQueriesPerTimeSeries(idEmpresa: string, hour: number): Promise<any[]> {
    const query = `
      SELECT
          start_time AS time,
          countMerge(total_queries) AS total_queries,
          avgMerge(duration_state) / 1e6 AS avg_ms
      FROM telemetry.spans_database_hourly_summary
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
      GROUP BY start_time
      ORDER BY start_time ASC;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON',
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        time: row.time,
        totalQueries: +row.total_queries,
        avgMs: row.avg_ms,
      };
    });
  }

  public async getTraces(idEmpresa: string, traceId: string): Promise<any> {
    const query = `
      SELECT
         *
      FROM telemetry.spans_database
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
      startTime: row.start_time,
      endTime: row.end_time,
      durationNs: row.duration_ns,
      durationMs: row.duration_ns / 1e6,
      dbStatement: row.db_statement,
      dbOperation: row.db_operation,
      dbTable: row.db_table,
      dbName: row.db_name,
    }));
  }

  public async list(idEmpresa: string, filters: SearchFilters): Promise<any[]> {
    const where: string[] = [];

    if (filters.databaseFilter?.queryContains) {
      where.push(`db_statement ILIKE '%${filters.databaseFilter.queryContains}%'`);
    }

    if (filters.databaseFilter?.tableName) {
      where.push(`db_table = '${filters.databaseFilter.tableName}'`);
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
        trace_id,
        span_id,
        parent_span_id,
        service_name,
        service_version,
        service_environment,
        start_time,
        end_time,
        duration_ns,
        db_statement,
        db_operation,
        db_table,
        db_name
        FROM telemetry.spans_database
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
      startTime: row.start_time,
      endTime: row.end_time,
      durationNs: row.duration_ns,
      dbStatement: row.db_statement,
      dbOperation: row.db_operation,
      dbTable: row.db_table,
      dbName: row.db_name,
    }));
  }
}
