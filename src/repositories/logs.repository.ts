import { ClickHouseClient } from '@clickhouse/client';

type SearchMode = 'all' | 'any' | 'substring';

const DEFAULT_LOG_WINDOW_HOURS = 3;
const LOG_QUERY_MAX_THREADS = 2;
const LOG_QUERY_MAX_EXECUTION_TIME_SECONDS = 10;

type LogCursor = {
  timestamp: string;
  traceId: string;
  spanId: string;
};

export class LogsRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async list(idEmpresa: string, idProject: string, qs: Record<string, string>) {
    const traceId = (qs.traceId || '').trim();
    const message = (qs.message || '').trim();
    const rawSearchMode = ((qs.searchMode || 'all') as string).toLowerCase();
    const searchMode: SearchMode = ['all', 'any', 'substring'].includes(rawSearchMode) ? (rawSearchMode as SearchMode) : 'all';
    const severityText = (qs.severityText || 'ALL').toUpperCase();
    const startTime = (qs.startTime || qs.startDate || '').trim();
    const endTime = (qs.endTime || qs.endDate || '').trim();
    const cursor = this.parseCursor(qs.cursor);

    if (startTime && Number.isNaN(new Date(startTime).getTime())) {
      throw new Error('Invalid startTime');
    }

    if (endTime && Number.isNaN(new Date(endTime).getTime())) {
      throw new Error('Invalid endTime');
    }

    if (startTime && endTime && new Date(startTime) > new Date(endTime)) {
      throw new Error('startTime cannot be greater than endTime');
    }

    const parsedLimit = Number(qs.limit || 50);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
    const candidateLimit = 10000;

    const useTokenSearch = message.length > 0 && searchMode !== 'substring';
    const searchTokens = useTokenSearch ? this.tokenizeSearch(message) : [];

    const preWhere: string[] = ['id_empresa = {id_empresa: String}', 'project_id = {project_id: String}'];
    const where: string[] = ['project_id = {project_id: String}'];

    if (startTime) {
      preWhere.push(`timestamp >= parseDateTime64BestEffort({start_time: String}, 9, 'UTC')`);
    } else if (!traceId) {
      preWhere.push(`timestamp >= now64(9, 'UTC') - INTERVAL ${DEFAULT_LOG_WINDOW_HOURS} HOUR`);
    }

    if (endTime) {
      preWhere.push(`timestamp <= parseDateTime64BestEffort({end_time: String}, 9, 'UTC')`);
    }

    if (traceId) {
      where.push(`trace_id = {trace_id: String}`);
    }

    if (severityText !== 'ALL') {
      where.push(`severity_text = {severity_text: String}`);
    }

    if (cursor) {
      where.push(`(timestamp, trace_id, span_id) < (parseDateTime64BestEffort({cursor_timestamp: String}, 9, 'UTC'), {cursor_trace_id: String}, {cursor_span_id: String})`);
    }

    if (message && (!useTokenSearch || searchTokens.length === 0)) {
      where.push(`message LIKE concat('%', {message: String}, '%')`);
    }

    if (useTokenSearch && searchTokens.length > 0) {
      where.push(this.buildTokenSearchCondition({
        searchMode: searchMode === 'any' ? 'any' : 'all',
        traceId,
        startTime,
        endTime,
      }));

    }

    const query = `
      SELECT
        id_empresa,
        project_id,
        timestamp,
        trace_id,
        span_id,
        severity_text,
        severity_number,
        service_name,
        environment,
        host,
        app_version,
        logger_name,
        message,
        exception_type,
        exception_message,
        ingestion_time
      FROM telemetry.logs
      PREWHERE ${preWhere.join(' AND ')}
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY timestamp DESC, trace_id DESC, span_id DESC
      LIMIT {limit: Int32}
    `;

    const resultSet = await this.clickHouseClient.query({
      query,
      clickhouse_settings: this.getReadSettings(limit),
      query_params: {
        id_empresa: idEmpresa,
        project_id: idProject,
        limit,
        trace_id: traceId,
        severity_text: severityText,
        start_time: startTime,
        end_time: endTime,
        cursor_timestamp: cursor?.timestamp || '',
        cursor_trace_id: cursor?.traceId || '',
        cursor_span_id: cursor?.spanId || '',
        message,
        tokens: searchTokens,
        token_count: searchTokens.length,
        candidate_limit: candidateLimit,
      },
    });

    const result = await resultSet.json();

    const data = result.data.map((row: any) => ({
      idEmpresa: row.id_empresa,
      idProject: row.project_id,
      timestamp: row.timestamp,
      traceId: row.trace_id,
      spanId: row.span_id,
      severityText: row.severity_text,
      severityNumber: row.severity_number,
      serviceName: row.service_name,
      environment: row.environment,
      host: row.host,
      appVersion: row.app_version,
      loggerName: row.logger_name,
      message: row.message,
      exceptionType: row.exception_type,
      exceptionMessage: row.exception_message,
      ingestionTime: row.ingestion_time,
    }));

    const last = data[data.length - 1];

    return {
      data,
      nextCursor: data.length === limit && last ? this.encodeCursor({ timestamp: last.timestamp, traceId: last.traceId, spanId: last.spanId }) : null,
    };
  }

  async findOne(idEmpresa: string, idProject: string, traceId: string, spanId: string, qs: Record<string, string>) {
    const timestamp = (qs.timestamp || '').trim();
    const preWhere: string[] = ['id_empresa = {id_empresa: String}', 'project_id = {project_id: String}'];
    const where: string[] = ['project_id = {project_id: String}', 'trace_id = {trace_id: String}', 'span_id = {span_id: String}'];

    if (timestamp) {
      if (Number.isNaN(new Date(timestamp).getTime())) {
        throw new Error('Invalid timestamp');
      }

      preWhere.push(`timestamp = parseDateTime64BestEffort({timestamp: String}, 9, 'UTC')`);
    }

    const query = `
      SELECT
        id_empresa,
        project_id,
        timestamp,
        trace_id,
        span_id,
        severity_text,
        severity_number,
        service_name,
        environment,
        host,
        app_version,
        logger_name,
        message,
        attributes,
        body,
        exception_type,
        exception_message,
        exception_stacktrace,
        ingestion_time
      FROM telemetry.logs
      PREWHERE ${preWhere.join(' AND ')}
      WHERE ${where.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const resultSet = await this.clickHouseClient.query({
      query,
      clickhouse_settings: this.getReadSettings(1),
      query_params: {
        id_empresa: idEmpresa,
        project_id: idProject,
        trace_id: traceId,
        span_id: spanId,
        timestamp,
      },
    });

    const result = await resultSet.json();
    const row = result.data[0] as any;

    if (!row) return null;

    return {
      idEmpresa: row.id_empresa,
      idProject: row.project_id,
      timestamp: row.timestamp,
      traceId: row.trace_id,
      spanId: row.span_id,
      severityText: row.severity_text,
      severityNumber: row.severity_number,
      serviceName: row.service_name,
      environment: row.environment,
      host: row.host,
      appVersion: row.app_version,
      loggerName: row.logger_name,
      message: row.message,
      attributes: this.parseJsonSafely(row.attributes),
      body: this.parseJsonSafely(row.body),
      exceptionType: row.exception_type,
      exceptionMessage: row.exception_message,
      exceptionStacktrace: row.exception_stacktrace,
      ingestionTime: row.ingestion_time,
    };
  }

  private parseJsonSafely(value: unknown) {
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private tokenizeSearch(message: string): string[] {
    return Array.from(
      new Set(
        message
          .toLowerCase()
          .split(/[^\p{L}\p{N}]+/u)
          .map((t) => t.trim())
          .filter((t) => t.length >= 2),
      ),
    );
  }

  private buildTokenSearchCondition(args: {
    searchMode: Exclude<SearchMode, 'substring'>;
    traceId: string;
    startTime: string;
    endTime: string;
  }): string {
    const { searchMode, traceId, startTime, endTime } = args;

    const preWhere: string[] = ['id_empresa = {id_empresa: String}', 'project_id = {project_id: String}'];
    const where: string[] = ['token IN {tokens:Array(String)}', 'project_id = {project_id: String}'];

    if (startTime) {
      preWhere.push(`timestamp >= parseDateTime64BestEffort({start_time: String}, 9, 'UTC')`);
    } else if (!traceId) {
      preWhere.push(`timestamp >= now64(9, 'UTC') - INTERVAL ${DEFAULT_LOG_WINDOW_HOURS} HOUR`);
    }

    if (endTime) {
      preWhere.push(`timestamp <= parseDateTime64BestEffort({end_time: String}, 9, 'UTC')`);
    }

    if (traceId) {
      where.push(`log_key LIKE concat({trace_id: String}, '-%')`);
    }

    const having = searchMode === 'all' ? 'HAVING uniqExact(token) = {token_count:UInt32}' : '';

    return `concat(trace_id, '-', span_id) IN (
        SELECT
          log_key
        FROM telemetry.logs_tokens
        PREWHERE ${preWhere.join(' AND ')}
        WHERE ${where.join(' AND ')}
        GROUP BY log_key
        ${having}
        ORDER BY max(timestamp) DESC
        LIMIT {candidate_limit:Int32}
      )`;
  }

  private parseCursor(cursor?: string): LogCursor | null {
    if (!cursor) return null;

    try {
      const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));

      if (typeof parsed?.timestamp !== 'string' || typeof parsed?.traceId !== 'string' || typeof parsed?.spanId !== 'string') {
        throw new Error('Invalid cursor');
      }

      if (Number.isNaN(new Date(parsed.timestamp).getTime())) {
        throw new Error('Invalid cursor');
      }

      return parsed;
    } catch {
      throw new Error('Invalid cursor');
    }
  }

  private encodeCursor(cursor: LogCursor): string {
    return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
  }

  private getReadSettings(limit: number) {
    return {
      max_threads: LOG_QUERY_MAX_THREADS,
      max_execution_time: LOG_QUERY_MAX_EXECUTION_TIME_SECONDS,
      max_result_rows: limit.toString(),
      result_overflow_mode: 'break' as const,
    };
  }
}
