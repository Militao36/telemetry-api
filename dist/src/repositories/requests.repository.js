"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsRepository = void 0;
class RequestsRepository {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async recentRequests(idEmpresa, idProject, hour, httpMethod = 'ALL') {
        const query = `
      SELECT
         *
      FROM telemetry.spans_http
      WHERE id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      ${httpMethod !== 'ALL' ? `and http_method = {httpMethod:String}` : ''}
      and start_time >= now() - toIntervalHour({hour:Int32})
      ORDER BY start_time DESC
      LIMIT 10;
    `;
        const result = await this.clickHouseClient.query({
            query,
            query_params: {
                idEmpresa,
                idProject,
                httpMethod: httpMethod !== 'ALL' ? httpMethod : undefined,
                hour,
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
    async getSlowestRequests(idEmpresa, idProject, hour, httpMethod = 'ALL') {
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

      WHERE id_empresa = {idEmpresa:String}
      AND project_id = {idProject:String}
      ${httpMethod !== 'ALL' ? `and http_method = {httpMethod:String}` : ''}
      and latest_start_time >= now() - toIntervalHour({hour:Int32})

      GROUP BY
          http_target,
          http_method

      ORDER BY duration_ns DESC
      LIMIT 10;
    `;
        const result = await this.clickHouseClient.query({
            query,
            query_params: {
                idEmpresa,
                idProject,
                httpMethod: httpMethod !== 'ALL' ? httpMethod : undefined,
                hour,
            },
            format: 'JSON',
        });
        const rows = await result.json();
        return rows.data.map((row) => {
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
    async getTraces(idEmpresa, idProject, traceId) {
        const query = `
      SELECT
         *
      FROM telemetry.spans_http
      WHERE id_empresa = {idEmpresa:String}
      AND trace_id = {traceId:String}
      or parent_span_id = {traceId:String}
      or span_id = {traceId:String}
      and project_id = {idProject:String}
    `;
        const result = await this.clickHouseClient.query({
            query,
            query_params: {
                idEmpresa,
                traceId,
                idProject
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
    async getResponseStatusDistribution(idEmpresa, hour, httpMethod = 'ALL') {
        const query = `
      SELECT
          http_status,
          countMerge(request_count) as count,
          avgMerge(avg_duration) as avg_ms
      FROM telemetry.spans_http_metrics_by_minute
      WHERE id_empresa = {idEmpresa:String}
      and time_bucket >= now() - toIntervalHour({hour:Int32})
       ${httpMethod !== 'ALL' ? `and http_method = {httpMethod:String}` : ''}
      GROUP BY http_status
      ORDER BY count DESC;
    `;
        const result = await this.clickHouseClient.query({
            query,
            query_params: {
                idEmpresa,
                hour,
                httpMethod: httpMethod !== 'ALL' ? httpMethod : undefined,
            },
            format: 'JSON',
        });
        const rows = await result.json();
        return rows.data.map((row) => {
            return {
                httpStatus: row.http_status,
                count: row.count,
                avgMs: row.avg_ms,
            };
        });
    }
    async list(idEmpresa, filters) {
        var _a, _b, _c, _d, _e;
        const where = [];
        const queryParams = { idEmpresa };
        if ((_a = filters.httpFilter) === null || _a === void 0 ? void 0 : _a.method) {
            where.push(`http_method = {method:String}`);
            queryParams.method = filters.httpFilter.method;
        }
        if ((_b = filters.httpFilter) === null || _b === void 0 ? void 0 : _b.statusCode) {
            where.push(`http_status = {statusCode:Int32}`);
            queryParams.statusCode = filters.httpFilter.statusCode;
        }
        if ((_c = filters.httpFilter) === null || _c === void 0 ? void 0 : _c.pathContains) {
            where.push(`http_target ILIKE {pathContains:String}`);
            queryParams.pathContains = `%${filters.httpFilter.pathContains}%`;
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
        *
      FROM telemetry.spans_http
      ${whereClause}
      ${where.length ? 'AND' : 'WHERE'} id_empresa = {idEmpresa:String}
      ORDER BY start_time DESC
      LIMIT {limit:Int32}
      OFFSET {offset:Int32}
    `;
        queryParams.limit = (_d = filters.limit) !== null && _d !== void 0 ? _d : 20;
        queryParams.offset = (_e = filters.offset) !== null && _e !== void 0 ? _e : 0;
        const result = await this.clickHouseClient.query({ query, query_params: queryParams, format: 'JSONEachRow' });
        const rows = (await result.json());
        return rows.map((row) => ({
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
exports.RequestsRepository = RequestsRepository;
