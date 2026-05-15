import { ClickHouseClient } from "@clickhouse/client";

export class LogsRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async list(idEmpresa: string, idProject: string, qs: Record<string, string>) {
    const traceId = (qs.traceId || "").trim();
    const message = (qs.message || "").trim();
    const severityText = (qs.severityText || "ALL").toUpperCase();
    const startTime = (qs.startTime || qs.startDate || "").trim();
    const endTime = (qs.endTime || qs.endDate || "").trim();

    if (startTime && Number.isNaN(new Date(startTime).getTime())) {
      throw new Error("Invalid startTime");
    }

    if (endTime && Number.isNaN(new Date(endTime).getTime())) {
      throw new Error("Invalid endTime");
    }

    if (startTime && endTime && new Date(startTime) > new Date(endTime)) {
      throw new Error("startTime cannot be greater than endTime");
    }

    const parsedLimit = Number(qs.limit || 50);
    const parsedOffset = Number(qs.offset || 0);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

    let query = `
      SELECT *
      FROM telemetry.logs
    `;

    query += ` WHERE id_empresa = {id_empresa: String}`;
    query += ` AND project_id = {project_id: String}`;

    if (traceId) {
      query += ` AND trace_id = {trace_id: String} `;
    }

    if (severityText !== 'ALL') {
      query += ` AND severity_text = {severity_text: String} `;
    }

    if (startTime) {
      query += ` AND timestamp >= toDateTime({start_time: String}) `;
    }

    if (endTime) {
      query += ` AND timestamp <= toDateTime({end_time: String}) `;
    }

    if (message) {
      query += ` AND lower(message) LIKE concat('%', {message: String}, '%') `;
    }

    query += ` ORDER BY timestamp DESC `;

    query += ` LIMIT {limit: Int} OFFSET {offset: Int} `;
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
        message: message.toLocaleLowerCase(),
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
      attributes: JSON.parse(row.attributes),
      body: JSON.parse(row.body),
      exceptionType: row.exception_type,
      exceptionMessage: row.exception_message,
      exceptionStacktrace: row.exception_stacktrace,
      ingestionTime: row.ingestion_time,
    }));
  }
}
