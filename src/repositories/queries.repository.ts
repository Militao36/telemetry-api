import { Knex } from "knex";

export class QueriesRepository {
  database: Knex;

  constructor({ database }) {
    this.database = database;
  }

  async avgQueryTimeByType(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all' = 'all') {
    const query = `
      SELECT 
        count(*) AS total_queries,
        avg(duration_ns) / 1e6 AS avg_ms,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ns) / 1e6 AS p50_ms,
        percentile_cont(0.9) WITHIN GROUP (ORDER BY duration_ns) / 1e6 AS p90_ms,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ns) / 1e6 AS p95_ms,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ns) / 1e6 AS p99_ms
      FROM spans_database
      WHERE start_time >= now() - interval '${hour} hour'
      ${queryType !== 'all' ? `AND db_statement ILIKE '${queryType}%'` : ''}
      AND id_empresa = '${idEmpresa}';
    `;

    const result = await this.database.raw(query);

    return result.rows.map((item: any) => ({
      totalQueries: item.total_queries,
      avgMs: item.avg_ms,
      p50Ms: item.p50_ms,
      p90Ms: item.p90_ms,
      p95Ms: item.p95_ms,
      p99Ms: item.p99_ms,
    }))[0];
  }

  async slowestQueries(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all' = 'all', limit: number = 10) {
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
      FROM spans_database
      WHERE start_time >= now() - interval '${hour} hour'
      ${queryType !== 'all' ? `AND db_operation = '${queryType}'` : ''}
      AND id_empresa = '${idEmpresa}'
      ORDER BY duration_ns DESC
      LIMIT ${limit};
    `;

    const result = await this.database.raw(query);

    return result.rows.map((item: any) => ({
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
          WHEN db_statement ILIKE 'select%' THEN 'select'
          WHEN db_statement ILIKE 'insert%' THEN 'insert'
          WHEN db_statement ILIKE 'update%' THEN 'update'
          WHEN db_statement ILIKE 'delete%' THEN 'delete'
          ELSE 'other'
        END AS query_type,
        COUNT(*) AS total
      FROM spans_database
      WHERE start_time >= now() - interval '${hour} hour'
      AND id_empresa = '${idEmpresa}'
      GROUP BY query_type;
    `;

    const result = await this.database.raw(query);

    return result.rows.map((item: any) => ({
      queryType: item.query_type,
      total: item.total,
    }));
  }

  async getQueryVolumeByHours(idEmpresa: string, hour: number) {
    const query = `
      SELECT
          date_trunc('hour', start_time) AS interval_hour,
          COUNT(*) FILTER (WHERE db_operation = 'select') AS selects,
          COUNT(*) FILTER (WHERE db_operation = 'insert') AS inserts,
          COUNT(*) FILTER (WHERE db_operation = 'update') AS updates,
          COUNT(*) FILTER (WHERE db_operation = 'delete') AS deletes
      FROM spans_database
      WHERE start_time >= now() - interval '${hour} hour'
      AND id_empresa = '${idEmpresa}'
      GROUP BY interval_hour
      ORDER BY interval_hour ASC;
    `;


    const result = await this.database.raw(query);

    return result.rows.map(item => ({
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
          date_trunc('hour', start_time) AS time,
          count(*) AS total_queries,
          avg(duration_ns) / 1e6 AS avg_ms
      FROM spans_database
      WHERE start_time >= now() - interval '${hour} hour'
      AND id_empresa = '${idEmpresa}'
      GROUP BY time
      ORDER BY time ASC;
    `;


    const result = await this.database.raw(query);

    return result.rows.map((row: any) => {
      return {
        time: row.time,
        totalQueries: +row.total_queries,
        avgMs: row.avg_ms
      }
    })
  }
}
