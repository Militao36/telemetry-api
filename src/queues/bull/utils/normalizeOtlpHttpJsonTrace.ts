export interface NormalizedSpanHttp {
  id_empresa: string;

  trace_id: string;
  span_id: string;
  parent_span_id: string;

  service_name: string;
  name: string;

  start_time: string;
  end_time: string;
  duration_ns: number;

  http_url: string;
  http_method: string;
  http_target: string;
  http_status: number;

  attributes: string; // JSON string

  ingestion_time: Date;
}

export interface NormalizedSpanDatabase {
  id_empresa: string;

  trace_id: string;
  span_id: string;
  parent_span_id: string;

  service_name: string;
  name: string;

  start_time: string;
  end_time: string;
  duration_ns: number;

  db_system: string;
  db_statement: string;
  db_duration: number;
  db_table: string;
  db_operation: string;
  db_user: string;
  db_name: string;

  attributes: string; // JSON string

  ingestion_time: Date;
}

const EXCLUDES_ROUTES = [
  '/health',
  '/favicon.ico',
]

export function normalizeOTLP(idEmpresa: string, resourceSpans: any[]) {
  const spans_http: Partial<NormalizedSpanHttp>[] = [];
  const spans_database: Partial<NormalizedSpanDatabase>[] = [];

  for (const rs of resourceSpans || []) {
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

        const start = toCHDateTime64(startNano);
        const end = toCHDateTime64(endNano);

        const spanType = getSpanType(span);

        const duration_ns = Number(endNano) - Number(startNano);

        const baseFields = {
          id_empresa: idEmpresa,
          trace_id: traceId,
          span_id: spanId,
          parent_span_id: parentSpanId || "0000000000000000",

          service_name: serviceName,
          service_version: serviceVersion,
          service_environment: environment,
          name: span.name,
          kind: toEnumKind(span.kind),
          start_time: start,
          end_time: end,
          duration_ns,
          attributes: span.attributes,
        };

        // ------------------------------------------------------------------
        //  SEPARAÇÃO DE SPANS POR TIPO
        // ------------------------------------------------------------------

        if (spanType === "HTTP") {
          const http_method = findAttr(span, "http.method");
          const http_target = findAttr(span, "http.target");

          if (http_method === 'OPTIONS') continue;
          if(EXCLUDES_ROUTES.includes(http_target as string)) {
            continue;
          }

          const http_url = findAttr(span, "http.url");
          const http_status = findAttr(span, "http.status_code") as number;

          spans_http.push({
            ...baseFields,
            http_url: http_url as any,
            http_method: http_method as any,
            http_target: http_target as any,
            http_status: Number.isFinite(http_status) && (http_status || 0) >= 0 ? http_status : 0,
          });
        }

        else if (spanType === "Database") {
          const db_duration = findAttr(span, "db.duration");
          const db_statement = findAttr(span, "db.statement");
          const db_system = findAttr(span, "db.system");
          const db_table = findAttr(span, "db.sql.table");
          const db_user = findAttr(span, "db.user");
          const db_name = findAttr(span, "db.name");

          spans_database.push({
            ...baseFields,
            db_system: db_system as any as any,
            db_statement: db_statement || null as any,
            db_duration: db_duration ? Number(db_duration) : duration_ns as any,
            db_table: db_table || null as any,
            db_operation: findAttr(span, "db.operation") || null as any,
            db_user: db_user || null as any,
            db_name: db_name || null as any,
          });
        }

      }
    }
  }

  return { spans_http, spans_database };
}

function formatCHDate(date: Date) {
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function toCHDateTime64(nanos: string) {
  const date = new Date(Number(nanos) / 1e6);
  const iso = date.toISOString();
  return iso.replace('T', ' ').replace('Z', '');
}

function toEnumKind(kind: string): string {
  // Bate com o Enum8 da migration:
  // 'UNSPECIFIED'=0, 'INTERNAL'=1, 'SERVER'=2, 'CLIENT'=3, 'PRODUCER'=4, 'CONSUMER'=5
  const valid = new Set(['UNSPECIFIED', 'INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER']);
  return valid.has(kind) ? kind : 'UNSPECIFIED';
}

function findAttr(span: any, key: any): string | number | boolean | null {
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

function toUInt8Status(code: number | string | undefined): number {
  // OpenTelemetry: UNSET=0, OK=1, ERROR=2
  if (typeof code === 'number') return Math.max(0, Math.min(2, code));
  if (typeof code === 'string') {
    const c = code.toUpperCase();
    if (c === 'OK') return 1;
    if (c === 'ERROR') return 2;
    return 0;
  }
  return 0;
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


