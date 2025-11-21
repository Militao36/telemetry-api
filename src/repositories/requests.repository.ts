import { ClickHouseClient } from "@clickhouse/client";

export class RequestsRepository {
  clickHouseClient: ClickHouseClient;

  constructor({ clickHouseClient }) {
    this.clickHouseClient = clickHouseClient;
  }

  public async recentRequests(idEmpresa: string, limit: number): Promise<any> {
    const query = `
      SELECT
         *
      FROM telemetry.spans_http
      WHERE id_empresa = '${idEmpresa}'
      ORDER BY ingestion_time DESC
      LIMIT ${limit};
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON'
    });

    const rows = await result.json();

    return rows.data.map((row: any) => ({
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

  public async getTraces(idEmpresa: string, traceId: string): Promise<any> {
    const query = `
      SELECT
         *
      FROM telemetry.spans_http
      WHERE id_empresa = '${idEmpresa}'
      AND trace_id = '${traceId}'
      or parent_span_id = '${traceId}'
      or span_id = '${traceId}';
    `;

    const result = await this.clickHouseClient.query({
      query,
      format: 'JSON'
    });

    const rows = await result.json();

    return rows.data.map((row: any) => ({
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