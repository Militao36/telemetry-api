"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLog = normalizeLog;
function normalizeLog(raw) {
    var _a, _b, _c;
    const severityMap = {
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
        exception_type: ((_a = raw.error) === null || _a === void 0 ? void 0 : _a.type) || '',
        exception_message: ((_b = raw.error) === null || _b === void 0 ? void 0 : _b.message) || '',
        exception_stacktrace: ((_c = raw.error) === null || _c === void 0 ? void 0 : _c.stack) || '',
    };
}
