import { ClickHouseClient } from "@clickhouse/client";

export class QueriesRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async avgQueryTimeByType(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all') {
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
      format: "JSON"
    });

    const result = await resultSet.json<{
      total_queries: number;
      avg_ms: number;
      p50_ms: number;
      p90_ms: number;
      p95_ms: number;
      p99_ms: number;
    }>();

    return result.data.map(item => ({
      totalQueries: item.total_queries,
      avgMs: item.avg_ms,
      p50Ms: item.p50_ms,
      p90Ms: item.p90_ms,
      p95Ms: item.p95_ms,
      p99Ms: item.p99_ms,
    }))[0];
  }

  async slowestQueries(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all', limit: number = 10) {
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
        duration_ns / 1e6 AS duration_ms,
        db_statement,
        db_table,
        db_name
      FROM "telemetry"."spans_database"
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      ${queryType !== 'all' ? `and db_statement like '${queryType}%'` : ''}
      and id_empresa = '${idEmpresa}'
      ORDER BY duration_ms DESC
      LIMIT ${limit}
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: "JSON"
    });

    const result = await resultSet.json<{
      trace_id: string;
      span_id: string;
      parent_span_id: string;
      service_name: string;
      service_version: string;
      service_environment: string;
      start_time: string;
      end_time: string;
      duration_ms: number;
      db_statement: string;
      db_table: string;
      db_name: string;
    }>();

    return result.data.map(item => ({
      traceId: item.trace_id,
      spanId: item.span_id,
      parentSpanId: item.parent_span_id,
      serviceName: item.service_name,
      serviceVersion: item.service_version,
      serviceEnvironment: item.service_environment,
      startTime: item.start_time,
      endTime: item.end_time,
      durationMs: item.duration_ms,
      dbStatement: item.db_statement,
      dbTable: item.db_table,
      dbName: item.db_name,
    }));
  }

  async queryVolumeByType(idEmpresa: string, hour: number) {
    const query = `
      SELECT 
        CASE 
          WHEN db_statement LIKE 'select%' THEN 'select'
          WHEN db_statement LIKE 'insert%' THEN 'insert'
          WHEN db_statement LIKE 'update%' THEN 'update'
          WHEN db_statement LIKE 'delete%' THEN 'delete'
          ELSE 'other'
        END AS query_type,
        count(*) AS total
      FROM "telemetry"."spans_database"
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      and id_empresa = '${idEmpresa}'
      GROUP BY query_type
    `;

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: "JSON"
    });

    const result = await resultSet.json<{ query_type: string; total: number }>();

    return result.data.map(item => ({
      queryType: item.query_type,
      total: item.total,
    }));
  }

  async getQueryVolumeByHours(idEmpresa: string, hour: number) {
    const query = `
      SELECT
          toStartOfInterval(start_time, INTERVAL 1 hour) AS interva_hour,
          countIf(db_operation = 'select') AS selects,
          countIf(db_operation = 'insert') AS inserts,
          countIf(db_operation = 'update') AS updates,
          countIf(db_operation = 'delete') AS deletes
      FROM telemetry.spans_database
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
      GROUP BY interva_hour
      ORDER BY interva_hour ASC;
    `

    const resultSet = await this.clickHouseClient.query({
      query: query,
      format: "JSON"
    });

    const result = await resultSet.json<{
      interva_hour: string;
      selects: number;
      inserts: number;
      updates: number;
      deletes: number;
    }>();

    return result.data.map(item => ({
      interval: item.interva_hour,
      selects: item.selects,
      inserts: item.inserts,
      updates: item.updates,
      deletes: item.deletes,
    }));
  }

   public async getQueriesPerTimeSeries(idEmpresa: string, hour: number): Promise<any[]> {
    const query = `
      SELECT
          toStartOfInterval(start_time, INTERVAL 1 HOUR) AS time,
          count(*) AS total_queries,
          avg(duration_ns) / 1e6 AS avg_ms
      FROM telemetry.spans_database
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
      GROUP BY time
      ORDER BY time ASC;
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON'
    });

    const rows = await result.json();

    return rows.data.map((row: any) => {
      return {
        time: row.time,
        totalQueries: +row.total_queries,
        avgMs: row.avg_ms
      }
    })
  }
}
