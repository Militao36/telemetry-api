import { DateTime } from 'luxon';
import { redactJsonString, redactSensitiveData } from '../../../utils/redactSensitiveData';

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
  id_empresa?: string;
  project_id?: string;
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
  attributes: string | Record<string, any>;
  body: string | Record<string, any>;
  exception_type: string;
  exception_message: string;
  exception_stacktrace: string;
}

export interface ResourceLog {
  resource: {
    attributes: {
      key: string;
      value: {
        stringValue?: string;
        intValue?: number;
        arrayValue?: { values: { stringValue: string }[] };
      };
    }[];
  };
  scopeLogs: {
    scope: {
      name: string;
      version: string;
    };
    logRecords: {
      timeUnixNano: string;
      observedTimeUnixNano: string;
      severityNumber: number;
      severityText: string;
      body: {
        stringValue: string;
      };
      attributes: {
        key: string;
        value: {
          stringValue: string;
        };
      }[];
      droppedAttributesCount: number;
      flags: number;
      traceId: string;
      spanId: string;
    }[];
  }[];
}

export function normalizeLog(idProject: string, idEmpresa: string, raw: ResourceLog[], redactionFields: string[] = []): NormalizedLog[] {
  return raw.flatMap((resourceLog) => {
    const resourceAttributes = Object.fromEntries(resourceLog.resource.attributes.map((attr) => [attr.key, Object.values(attr.value)[0]]));

    return resourceLog.scopeLogs.flatMap((scopeLog) => {
      return scopeLog.logRecords
        .map((logRecord) => {
          const logAttributes = Object.fromEntries(logRecord.attributes.map((attr) => [attr.key, Object.values(attr.value)[0]]));

          // devo salvar a data no formato que o clickhouse entende (DateTime64(9, 'UTC'))
          const timestamp = DateTime.fromMillis(Number(logRecord.timeUnixNano) / 1e6, { zone: 'UTC' }).toFormat('yyyy-MM-dd HH:mm:ss.SSS');

          const attributes = redactSensitiveData({ ...resourceAttributes, ...logAttributes }, redactionFields);
          const redactedLogRecord = redactSensitiveData(logRecord, redactionFields);
          const message = redactJsonString(logRecord.body.stringValue || '', redactionFields);
          const exceptionType = (logAttributes['exception.type'] as string) || '';
          const exceptionMessage = redactJsonString((logAttributes['exception.message'] as string) || '', redactionFields);
          const exceptionStacktrace = redactJsonString((logAttributes['exception.stacktrace'] as string) || '', redactionFields);

          if (!logRecord.traceId || !logRecord.spanId) {
            return null;
          }

          return {
            project_id: idProject,
            id_empresa: idEmpresa,
            timestamp,
            trace_id: logRecord.traceId || '',
            span_id: logRecord.spanId || '',
            severity_text: logRecord.severityText.toUpperCase(),
            severity_number: logRecord.severityNumber,
            service_name: (resourceAttributes['service.name'] as string) || 'unknown',
            environment: (resourceAttributes['deployment.environment'] as string) || 'unknown',
            host: (resourceAttributes['host.name'] as string) || 'local',
            app_version: (resourceAttributes['service.version'] as string) || 'unknown',
            logger_name: scopeLog.scope.name || 'unknown',
            message,
            attributes: JSON.stringify(attributes),
            body: JSON.stringify(redactedLogRecord),
            exception_type: exceptionType,
            exception_message: exceptionMessage,
            exception_stacktrace: exceptionStacktrace,
          };
        })
        .filter(Boolean);
    });
  });
}
