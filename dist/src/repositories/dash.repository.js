"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashRepository = void 0;
class DashRepository {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async getMetrics(idEmpresa, hour) {
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
            format: 'JSON'
        });
        const rows = await result.json();
        const row = rows.data[0];
        return {
            totalRequests: +row.total_requests,
            totalErrors: +row.total_errors,
            avgMs: row.avg_ms,
            p50Ms: row.p50_ms,
            p90Ms: row.p90_ms,
            p95Ms: row.p95_ms,
            p99Ms: row.p99_ms
        };
    }
    async getTopRequests(idEmpresa, hour) {
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
            format: 'JSON'
        });
        const rows = await result.json();
        return rows.data.map((row) => {
            return {
                httpMethod: row.http_method,
                path: row.path,
                totalRequests: +row.total_requests,
                avgMs: row.avg_ms
            };
        });
    }
    async getRequestPerTimeSeries(idEmpresa, hour) {
        const query = `
      SELECT
          toStartOfInterval(start_time, INTERVAL 1 HOUR) AS time,
          count(*) AS total_requests,
          avg(duration_ns) / 1e6 AS avg_ms
      FROM telemetry.spans_http
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
        return rows.data.map((row) => {
            return {
                time: row.time,
                totalRequests: +row.total_requests,
                avgMs: row.avg_ms
            };
        });
    }
    async getSlowestRequests(idEmpresa, hour) {
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
            format: 'JSON'
        });
        const rows = await result.json();
        return rows.data.map((row) => {
            return {
                httpMethod: row.http_method,
                path: row.path,
                durationMs: row.duration_ms,
                startTime: row.start_time,
                endTime: row.end_time
            };
        });
    }
    async getTotalQueries(idEmpresa, hour) {
        const queries = `
      SELECT
        count(*) AS total_queries
      FROM telemetry.spans_database
      WHERE start_time >= now() - INTERVAL ${hour} HOUR
      AND id_empresa = '${idEmpresa}'
    `;
        const result = await this.clickHouseClient.query({
            query: queries,
            format: 'JSON'
        });
        const rows = await result.json();
        const row = rows.data[0];
        return +row.total_queries;
    }
}
exports.DashRepository = DashRepository;
