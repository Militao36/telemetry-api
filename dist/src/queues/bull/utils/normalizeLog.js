"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLog = normalizeLog;
const luxon_1 = require("luxon");
function normalizeLog(idProject, idEmpresa, raw) {
    return raw.flatMap(resourceLog => {
        const resourceAttributes = Object.fromEntries(resourceLog.resource.attributes.map(attr => [
            attr.key,
            Object.values(attr.value)[0],
        ]));
        return resourceLog.scopeLogs.flatMap(scopeLog => {
            return scopeLog.logRecords.map(logRecord => {
                const logAttributes = Object.fromEntries(logRecord.attributes.map(attr => [
                    attr.key,
                    Object.values(attr.value)[0],
                ]));
                const timestamp = luxon_1.DateTime.fromMillis(Number(logRecord.timeUnixNano) / 1e6, { zone: 'UTC' }).toFormat("yyyy-MM-dd HH:mm:ss.SSS");
                const exceptionType = logAttributes['exception.type'] || '';
                const exceptionMessage = logAttributes['exception.message'] || '';
                const exceptionStacktrace = logAttributes['exception.stacktrace'] || '';
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
                    service_name: resourceAttributes['service.name'] || 'unknown',
                    environment: resourceAttributes['deployment.environment'] ||
                        'unknown',
                    host: resourceAttributes['host.name'] || 'local',
                    app_version: resourceAttributes['service.version'] || 'unknown',
                    logger_name: scopeLog.scope.name || 'unknown',
                    message: logRecord.body.stringValue || '',
                    attributes: JSON.stringify(Object.assign(Object.assign({}, resourceAttributes), logAttributes)),
                    body: JSON.stringify(logRecord),
                    exception_type: exceptionType,
                    exception_message: exceptionMessage,
                    exception_stacktrace: exceptionStacktrace,
                };
            }).filter(Boolean);
        });
    });
}
