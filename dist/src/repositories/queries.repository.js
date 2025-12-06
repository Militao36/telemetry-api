"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueriesRepository = void 0;
const lodash_1 = __importDefault(require("lodash"));
class QueriesRepository {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async avgQueryTimeByType(idEmpresa, idProject, hour, queryType = 'all') {
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
        const result = await resultSet.json();
        return result.data.map((item) => ({
            totalQueries: item.total_queries,
            avgMs: item.avg_ms,
            p50Ms: item.p50_ms,
            p90Ms: item.p90_ms,
            p95Ms: item.p95_ms,
            p99Ms: item.p99_ms,
        }))[0];
    }
    async avgQueryTimeByHour(idEmpresa, idProject, hour, queryType = 'all') {
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
        const result = await resultSet.json();
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
    async slowestQueries(idEmpresa, idProject, hour, queryType, limit = 10) {
        const query = `
      SELECT
        db_statement,
        db_table,
        db_params,
        start_time,
        countMerge(execution_count) AS total_executions,
        (sumMerge(sum_duration) / total_executions) / 1000000 AS average_duration_ms,
        maxMerge(max_duration) / 1000000 AS max_duration_ms,

        argMaxMerge(slowest_trace_id) AS slowest_trace_id,
        argMaxMerge(slowest_span_id) AS slowest_span_id
      FROM
          telemetry.spans_database_slowest
      WHERE start_time >= now() - INTERVAL {hour:Int32} HOUR
      AND db_statement <> ''
      ${queryType !== 'all' ? `AND db_statement like {queryType:String}` : ''}
      AND id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      GROUP BY
          db_statement,
          db_params,
          db_table,
          start_time
      ORDER BY
          max_duration_ms DESC
      LIMIT ${limit};
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
        const result = await resultSet.json();
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
    async queryVolumeByType(idEmpresa, idProject, hour) {
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
        const result = await resultSet.json();
        return result.data.map((item) => ({
            queryType: item.query_type,
            total: item.total,
        }));
    }
    async getQueryVolumeByHours(idEmpresa, idProject, hour) {
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
        for (const item of lodash_1.default.orderBy(result.data, 'start_time', 'asc')) {
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
    async getQueriesPerTimeSeries(idEmpresa, idProject, hour) {
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
        return rows.data.map((row) => {
            return {
                time: row.time,
                totalQueries: +row.total_queries,
                avgMs: row.avg_ms,
            };
        });
    }
    async getTraces(idEmpresa, idProject, traceId) {
        const query = `
      SELECT
         *
      FROM telemetry.spans_database
      WHERE id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      AND trace_id = {traceId:String}
      or parent_span_id = {traceId:String}
      or span_id = {traceId:String};
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
        return rows.data.map((row) => ({
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
    async list(idEmpresa, idProject, filters) {
        var _a, _b, _c, _d;
        const where = [];
        const queryParams = { idEmpresa, idProject };
        if ((_a = filters.databaseFilter) === null || _a === void 0 ? void 0 : _a.queryContains) {
            where.push(`db_statement ILIKE {queryContains:String}`);
            queryParams.queryContains = `%${filters.databaseFilter.queryContains}%`;
        }
        if ((_b = filters.databaseFilter) === null || _b === void 0 ? void 0 : _b.tableName) {
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
        queryParams.limit = (_c = filters.limit) !== null && _c !== void 0 ? _c : 20;
        queryParams.offset = (_d = filters.offset) !== null && _d !== void 0 ? _d : 0;
        const result = await this.clickHouseClient.query({ query, query_params: queryParams, format: 'JSONEachRow' });
        const rows = (await result.json());
        return rows.map((row) => ({
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
exports.QueriesRepository = QueriesRepository;
