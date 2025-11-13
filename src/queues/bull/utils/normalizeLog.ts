export interface RawLog {
  timestamp?: string;
  level: string;
  message: string;
  service?: string;
  environment?: string;
  host?: string;
  version?: string;
  traceId?: string;
  spanId?: string;
  context?: Record<string, any>;
  error?: {
    type?: string;
    message?: string;
    stack?: string;
  };
}

export interface NormalizedLog {
  timestamp: string;
  trace_id: string;
  span_id: string;
  severity_text: string;
  severity_number: number;
  service_name: string;
  environment: string;
  host: string;
  app_version: string;
  logger_name: string;
  message: string;
  attributes: Record<string, any>;
  body: string;
  exception_type: string;
  exception_message: string;
  exception_stacktrace: string;
}

export function normalizeLog(raw: RawLog) {
  const severityMap: Record<string, number> = {
    trace: 1,
    debug: 5,
    info: 9,
    warn: 13,
    error: 17,
    fatal: 21,
  };

  return {
    timestamp: raw.timestamp || new Date().toISOString(),
    trace_id: raw.traceId || '',
    span_id: raw.spanId || '',
    severity_text: raw.level.toUpperCase(),
    severity_number: severityMap[raw.level.toLowerCase()] || 0,
    service_name: raw.service || 'unknown',
    environment: raw.environment || 'unknown',
    host: raw.host || 'local',
    app_version: raw.version || 'unknown',
    logger_name: 'pino',
    message: raw.message || '',
    attributes: raw.context || {},
    body: JSON.stringify(raw),
    exception_type: raw.error?.type || '',
    exception_message: raw.error?.message || '',
    exception_stacktrace: raw.error?.stack || '',
  };
}
