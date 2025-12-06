import { ClickHouseClient } from "@clickhouse/client";

export class LogsRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  async list(idEmpresa: string, idProject: string, qs: Record<string, string>) {
    let query = `
      SELECT l.*
      FROM telemetry.logs_tokens t
      JOIN telemetry.logs l ON concat(l.trace_id, '-', l.span_id) = t.log_key
    `;

    query += ` WHERE id_empresa = {id_empresa: String}`;

    if (qs.traceId) {
      query += ` AND trace_id = {trace_id: String} `;
    }

    if (qs.severityText) {
      query += ` AND severity_text = {severity_text: String} `;
    }

    if (qs.startTime) {
      query += ` AND timestamp >= toDateTime({start_time: String}) `;
    }

    if (qs.endTime) {
      query += ` AND timestamp <= toDateTime({end_time: String}) `;
    }

    if (qs.message) {

      const args = qs.message.split(' ');
      query += ` AND (`;

      for (let i = 0; i < args.length; i++) {
        query += ` t.token = '${args[i].toLowerCase()}' or`;

        if (i === args.length - 1) {
          query = query.slice(0, -2); // remove last 'or'
        }
      }

      query += `)`;
    }

    const limit = qs.limit || 100;
    const offset = qs.offset || 0;


    const resultSet = await this.clickHouseClient.query({
      query,
      query_params: {
        id_empresa: idEmpresa,
        project_id: idProject,
        limit,
        offset,
        trace_id: qs.traceId,
        severity_text: qs.severityText,
        start_time: qs.startTime,
        end_time: qs.endTime,
        message: qs.message.toLocaleLowerCase(),
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