export interface NormalizedSpan {
  trace_id: string;
  span_id: string;
  parent_span_id: string;

  service_name: string;
  service_version: string | null;
  service_environment: string;

  name: string;
  kind: number;

  start_time: Date;
  end_time: Date;
  duration_ns: number;

  span_type: 'Database' | 'HTTP' | 'Messaging' | 'RPC' | 'Internal' | 'Unknown',

  status_code: number;
  status_message: string;

  http_method: string | null;
  http_route: string | null;
  http_target: string | null;
  http_status: number | null;

  db_system: string | null;
  db_statement: string | null;
  db_duration: number | null;

  attributes: string; // JSON string

  ingestion_time: Date;
}

function nanosToDate(nanos: string) {
  return new Date(Number(nanos) / 1e6);
}

function findAttr(span: any, key: any) {
  if (!span.attributes) return null;

  const a = span.attributes.find((attr: any) => attr.key === key);
  if (!a || !a.value) return null;

  const v = a.value;

  if (v.stringValue !== undefined) return v.stringValue;
  if (v.intValue !== undefined) return Number(v.intValue);
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  if (v.boolValue !== undefined) return !!v.boolValue;

  return null;
}

function getSpanType(span: any): string {
  const db_system = findAttr(span, "db.system");
  const http_method = findAttr(span, "http.method");
  const messaging_system = findAttr(span, "messaging.system");
  const rpc_system = findAttr(span, "rpc.system");

  // 1. Database
  if (db_system) {
    return 'Database';
  }

  // 2. HTTP
  if (http_method || findAttr(span, "http.status_code")) {
    return 'HTTP';
  }

  // 3. Messaging (Fila, Tópicos)
  if (messaging_system) {
    return 'Messaging';
  }

  // 4. RPC (gRPC, Thrift, etc.)
  if (rpc_system) {
    return 'RPC';
  }

  // 5. Internal (Lógica de Negócio, Funções internas)
  // O valor 1 corresponde a SPAN_KIND_INTERNAL
  if (span.kind === 1 || span.kind === "SPAN_KIND_INTERNAL") {
    return 'Internal';
  }

  // Se não for classificado, ou se o KIND for CLIENT/SERVER mas sem atributos específicos
  return 'Unknown';
}

export function normalizeOTLP(resourceSpans: any[]) {
  const all: Array<NormalizedSpan> = [];

  for (const rs of resourceSpans || []) {

    // RESOURCE ATTRIBUTES (iguais para HTTP e gRPC)
    const attrs = rs.resource?.attributes || [];

    const serviceName =
      attrs.find((a: any) => a.key === "service.name")?.value?.string_value ||
      attrs.find((a: any) => a.key === "service.name")?.value?.stringValue ||
      "unknown";

    const serviceVersion =
      attrs.find((a: any) => a.key === "service.version")?.value?.string_value ||
      attrs.find((a: any) => a.key === "service.version")?.value?.stringValue ||
      null;

    const environment =
      attrs.find((a: any) => a.key === "deployment.environment")?.value?.string_value ||
      attrs.find((a: any) => a.key === "deployment.environment")?.value?.stringValue ||
      "unknown";

    for (const scope of rs.scope_spans || rs.scopeSpans || []) {
      for (const span of scope.spans || []) {

        const traceId = span.trace_id || span.traceId;
        const spanId = span.span_id || span.spanId;
        const parentSpanId = span.parent_span_id || span.parentSpanId || "0000000000000000";

        const startNano = span.start_time_unix_nano || span.startTimeUnixNano;
        const endNano = span.end_time_unix_nano || span.endTimeUnixNano;

        const start = nanosToDate(startNano);
        const end = nanosToDate(endNano);

        const status = span.status || {};

        const db_duration = findAttr(span, "db.duration");
        const db_statement = findAttr(span, "db.statement");
        const db_system = findAttr(span, "db.system");

        const spanType = getSpanType(span);

        const duration_ns = Number(endNano) - Number(startNano);

        all.push({
          trace_id: Buffer.from(traceId).toString("hex"),
          span_id: Buffer.from(spanId).toString("hex"),
          parent_span_id: parentSpanId ? Buffer.from(parentSpanId).toString("hex") : "0000000000000000",

          service_name: serviceName,
          service_version: serviceVersion,
          service_environment: environment,

          name: span.name,
          kind: span.kind ?? 0,

          start_time: start,
          end_time: end,
          duration_ns,

          span_type: spanType as any,
          status_code: status.code ?? 0,
          status_message: status.message ?? "",

          http_method: findAttr(span, "http.method"),
          http_route: findAttr(span, "http.route"),
          http_target: findAttr(span, "http.target"),
          http_status: findAttr(span, "http.status_code"),

          db_system,
          db_statement,
          db_duration: db_duration || duration_ns,

          attributes: JSON.stringify(span.attributes || []),

          ingestion_time: new Date() // quero colocar com precisão de 9 casas
        });
      }
    }
  }

  return all;
}
