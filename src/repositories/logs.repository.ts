import { ClickHouseClient } from '@clickhouse/client';

type SearchMode = 'all' | 'any' | 'substring';

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
    const parsedOffset = Number(qs.offset || 0);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;
    const candidateLimit = 10000;
    let candidateLogKeys: string[] | undefined;

    const useTokenSearch = message.length > 0 && searchMode !== 'substring';
    const searchTokens = useTokenSearch ? this.tokenizeSearch(message) : [];

    const preWhere: string[] = ['id_empresa = {id_empresa: String}', 'project_id = {project_id: String}'];
    const where: string[] = ['project_id = {project_id: String}'];

    if (startTime) {
      preWhere.push(`timestamp >= toDateTime64({start_time: String}, 9, 'UTC')`);
    }

    if (endTime) {
      preWhere.push(`timestamp <= toDateTime64({end_time: String}, 9, 'UTC')`);
    }

    if (traceId) {
      where.push(`trace_id = {trace_id: String}`);
    }

    if (severityText !== 'ALL') {
      where.push(`severity_text = {severity_text: String}`);
    }

    if (message && (!useTokenSearch || searchTokens.length === 0)) {
      where.push(`message LIKE concat('%', {message: String}, '%')`);
    }

    if (useTokenSearch && searchTokens.length > 0) {
      const logKeys = await this.findCandidateLogKeysByTokens({
        idEmpresa,
        idProject,
        tokens: searchTokens,
        searchMode: searchMode === 'any' ? 'any' : 'all',
        startTime,
        endTime,
        candidateLimit,
      });

      if (logKeys.length === 0) {
        return [];
      }

      where.push(`concat(trace_id, '-', span_id) IN {log_keys:Array(String)}`);

      if (!startTime && !endTime) {
        preWhere.push(`timestamp >= now() - INTERVAL 7 DAY`);
      }

      candidateLogKeys = logKeys;
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
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY timestamp DESC
      LIMIT {limit: Int32} OFFSET {offset: Int32}
    `;

    const resultSet = await this.clickHouseClient.query({
      query,
      query_params: {
        id_empresa: idEmpresa,
        project_id: idProject,
        limit,
        offset,
        trace_id: traceId,
        severity_text: severityText,
        start_time: startTime,
        end_time: endTime,
        message,
        log_keys: candidateLogKeys,
      },
    });

    const result = await resultSet.json();

    return result.data.map((row: any) => ({
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
    }));
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

  private async findCandidateLogKeysByTokens(args: {
    idEmpresa: string;
    idProject: string;
    tokens: string[];
    searchMode: Exclude<SearchMode, 'substring'>;
    startTime: string;
    endTime: string;
    candidateLimit: number;
  }): Promise<string[]> {
    const { idEmpresa, idProject, tokens, searchMode, startTime, endTime, candidateLimit } = args;

    const preWhere: string[] = ['id_empresa = {id_empresa: String}', 'project_id = {project_id: String}'];
    const where: string[] = ['token IN {tokens:Array(String)}', 'project_id = {project_id: String}'];

    if (startTime) {
      preWhere.push(`timestamp >= toDateTime64({start_time: String}, 9, 'UTC')`);
    }

    if (endTime) {
      preWhere.push(`timestamp <= toDateTime64({end_time: String}, 9, 'UTC')`);
    }

    const having = searchMode === 'all' ? 'HAVING uniqExact(token) = {token_count:UInt32}' : '';

    const resultSet = await this.clickHouseClient.query({
      query: `
        SELECT
          log_key,
          max(timestamp) AS last_seen
        FROM telemetry.logs_tokens
        PREWHERE ${preWhere.join(' AND ')}
        WHERE ${where.join(' AND ')}
        GROUP BY log_key
        ${having}
        ORDER BY last_seen DESC
        LIMIT {candidate_limit:Int32}
      `,
      query_params: {
        id_empresa: idEmpresa,
        project_id: idProject,
        tokens,
        token_count: tokens.length,
        start_time: startTime,
        end_time: endTime,
        candidate_limit: candidateLimit,
      },
    });

    const result = await resultSet.json();
    return result.data.map((row: any) => row.log_key as string);
  }
}
