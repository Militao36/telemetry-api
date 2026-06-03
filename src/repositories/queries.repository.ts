import { ClickHouseClient } from '@clickhouse/client';
import { SearchFilters } from '../services/search.service';
import _ from 'lodash';
import { clampInt } from '../utils/queryParams';

export type QueryType = 'select' | 'insert' | 'update' | 'delete' | 'all';

export const QUERY_TYPES: QueryType[] = ['select', 'insert', 'update', 'delete', 'all'];

export class QueriesRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  // TODO
  async avgQueryTimeByType(idEmpresa: string, idProject: string, hour: number, queryType: QueryType) {
    const query = `
      SELECT
        count(*) AS total_queries,
        avg(duration_ns) / 1e6 AS avg_ms,
        quantile(0.5)(duration_ns)  / 1e6 AS p50_ms,
        quantile(0.9)(duration_ns)  / 1e6 AS p90_ms,
        quantile(0.95)(duration_ns) / 1e6 AS p95_ms,
        quantile(0.99)(duration_ns) / 1e6 AS p99_ms
      FROM "telemetry"."spans_database"
      WHERE start_time >= now() - INTERVAL {hour:Int32} HOUR
      ${queryType !== 'all' ? `and db_statement ILIKE {queryType:String}` : ''}
      and id_empresa = {idEmpresa:String}
      and project_id = {idProject:String}
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      query_params: {
        hour,
        queryType: queryType !== 'all' ? `${queryType.toUpperCase()}%` : undefined,
        idEmpresa,
        idProject,
      },
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
  async avgQueryTimeByHour(idEmpresa: string, idProject: string, hour: number, queryType: QueryType) {
    const query = `
      SELECT
        toStartOfInterval(start_time, INTERVAL 1 hour) AS interval_hour,
        avg(duration_ns) / 1e6 AS avg_ms,
        quantile(0.5)(duration_ns)  / 1e6 AS p50_ms,
        quantile(0.9)(duration_ns)  / 1e6 AS p90_ms,
        quantile(0.95)(duration_ns) / 1e6 AS p95_ms,
        quantile(0.99)(duration_ns) / 1e6 AS p99_ms
      FROM "telemetry"."spans_database"
      WHERE start_time >= now() - INTERVAL {hour:Int32} HOUR
      ${queryType !== 'all' ? `and db_statement ILIKE {queryType:String}` : ''}
      and id_empresa = {idEmpresa:String}
      and project_id = {idProject:String}
      GROUP BY interval_hour
      ORDER BY interval_hour ASC
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      query_params: {
        hour,
        queryType: queryType !== 'all' ? `${queryType.toUpperCase()}%` : undefined,
        idEmpresa,
        idProject,
      },
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

  async slowestQueries(
    idEmpresa: string,
    idProject: string,
    hour: number,
    queryType: 'select' | 'insert' | 'update' | 'delete' | 'all',
    limit: number = 10,
  ) {
    const safeLimit = clampInt(limit, 10, 1, 100);

    const query = `
      SELECT
        argMaxMerge(db_statement) AS db_statement,
        db_table,
        argMaxMerge(slowest_db_params) AS db_params,
        countMerge(execution_count) AS total_executions,
        (sumMerge(sum_duration) / countMerge(execution_count)) / 1000000 AS average_duration_ms,
        maxMerge(max_duration) / 1000000 AS max_duration_ms,

        argMaxMerge(slowest_trace_id) AS slowest_trace_id,
        argMaxMerge(slowest_span_id) AS slowest_span_id
      FROM
          telemetry.spans_database_slowest
      WHERE day >= toDate(now() - INTERVAL {hour:Int32} HOUR)
      AND hour >= now() - INTERVAL {hour:Int32} HOUR
      AND normalized_statement <> ''
      ${queryType !== 'all' ? `AND normalized_statement ilike {queryType:String}` : ''}
      AND id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      GROUP BY
          db_table,
          normalized_statement
      ORDER BY
          max_duration_ms DESC
      LIMIT {limit:Int32};
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      query_params: {
        hour,
        queryType: queryType !== 'all' ? `${queryType.toLowerCase()}%` : undefined,
        idEmpresa,
        idProject,
        limit: safeLimit,
      },
      format: 'JSON',
    });

    const result = await resultSet.json<{
      db_statement: string;
      db_params: string;
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
      dbParams: item.db_params,
      dbTable: item.db_table,
      executions: +item.total_executions,
      avgDurationMs: item.average_duration_ms,
    }));
  }

  async queryVolumeByType(idEmpresa: string, idProject: string, hour: number) {
    const query = `
      SELECT
          query_type,
          countMerge(total_queries) AS total
      FROM telemetry.spans_database_hourly_summary
      WHERE start_time >= now() - INTERVAL {hour:Int32} HOUR
      and id_empresa = {idEmpresa:String}
      and project_id = {idProject:String}
      GROUP BY query_type
      ORDER BY total DESC;
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      query_params: {
        hour,
        idEmpresa,
        idProject,
      },
      format: 'JSON',
    });

    const result = await resultSet.json<{ query_type: string; total: number }>();

    return result.data.map((item) => ({
      queryType: item.query_type,
      total: item.total,
    }));
  }

  async getQueryVolumeByHours(idEmpresa: string, idProject: string, hour: number) {
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
      WHERE start_time >= now() - INTERVAL {hour:Int32} HOUR
      AND id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      GROUP BY
          start_time,
          id_empresa,
          query_type
      ORDER BY start_time DESC;
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      query_params: {
        hour,
        idEmpresa,
        idProject,
      },
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

      switch (String(item.query_type).toUpperCase()) {
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

  public async getQueriesPerTimeSeries(idEmpresa: string, idProject: string, hour: number): Promise<any[]> {
    const query = `
      SELECT
          start_time AS time,
          countMerge(total_queries) AS total_queries,
          avgMerge(duration_state) / 1e6 AS avg_ms
      FROM telemetry.spans_database_hourly_summary
      WHERE start_time >= now() - INTERVAL {hour:Int32} HOUR
      AND id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      GROUP BY start_time
      ORDER BY start_time ASC;
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        hour,
        idEmpresa,
        idProject,
      },
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

  public async getTraces(idEmpresa: string, idProject: string, traceId: string): Promise<any> {
    const query = `
      SELECT
         *
      FROM telemetry.spans_database
      WHERE id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      AND (
        trace_id = {traceId:String}
        OR parent_span_id = {traceId:String}
        OR span_id = {traceId:String}
      );
    `;

    const result = await this.clickHouseClient.query({
      query,
      query_params: {
        idEmpresa,
        idProject,
        traceId,
      },
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

  public async list(idEmpresa: string, idProject: string, filters: SearchFilters): Promise<any[]> {
    const where: string[] = [];
    const queryParams: Record<string, any> = { idEmpresa, idProject };

    if (filters.databaseFilter?.queryContains) {
      where.push(`db_statement ILIKE {queryContains:String}`);
      queryParams.queryContains = `%${filters.databaseFilter.queryContains}%`;
    }

    if (filters.databaseFilter?.tableName) {
      where.push(`db_table = {tableName:String}`);
      queryParams.tableName = filters.databaseFilter.tableName;
    }

    if (filters.environment) {
      where.push(`service_environment = {environment:String}`);
      queryParams.environment = filters.environment;
    }

    if (filters.traceId) {
      where.push(`trace_id = {traceId:String}`);
      queryParams.traceId = filters.traceId;
    }

    if (filters.startTimeFrom) {
      where.push(`start_time >= parseDateTime64BestEffort({startTimeFrom:String})`);
      queryParams.startTimeFrom = filters.startTimeFrom;
    }

    if (filters.startTimeTo) {
      where.push(`start_time <= parseDateTime64BestEffort({startTimeTo:String})`);
      queryParams.startTimeTo = filters.startTimeTo;
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
        ${where.length ? 'AND' : 'WHERE'} id_empresa = {idEmpresa:String}
        AND project_id = {idProject:String}
      ORDER BY start_time DESC
      LIMIT {limit:Int32}
      OFFSET {offset:Int32}
    `;

    queryParams.limit = filters.limit ?? 20;
    queryParams.offset = filters.offset ?? 0;

    const result = await this.clickHouseClient.query({ query, query_params: queryParams, format: 'JSONEachRow' });

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
