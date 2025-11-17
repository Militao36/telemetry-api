"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOTLP = normalizeOTLP;
const EXCLUDES_ROUTES = [
    '/health',
    '/favicon.ico',
];
function normalizeOTLP(idEmpresa, resourceSpans) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const spans_http = [];
    const spans_database = [];
    for (const rs of resourceSpans || []) {
        const attrs = ((_a = rs.resource) === null || _a === void 0 ? void 0 : _a.attributes) || [];
        const serviceName = ((_c = (_b = attrs.find((a) => a.key === "service.name")) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.string_value) ||
            ((_e = (_d = attrs.find((a) => a.key === "service.name")) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e.stringValue) ||
            "unknown";
        const serviceVersion = ((_g = (_f = attrs.find((a) => a.key === "service.version")) === null || _f === void 0 ? void 0 : _f.value) === null || _g === void 0 ? void 0 : _g.string_value) ||
            ((_j = (_h = attrs.find((a) => a.key === "service.version")) === null || _h === void 0 ? void 0 : _h.value) === null || _j === void 0 ? void 0 : _j.stringValue) ||
            null;
        const environment = ((_l = (_k = attrs.find((a) => a.key === "deployment.environment")) === null || _k === void 0 ? void 0 : _k.value) === null || _l === void 0 ? void 0 : _l.string_value) ||
            ((_o = (_m = attrs.find((a) => a.key === "deployment.environment")) === null || _m === void 0 ? void 0 : _m.value) === null || _o === void 0 ? void 0 : _o.stringValue) ||
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
                if (spanType === "HTTP") {
                    const http_method = findAttr(span, "http.method");
                    const http_target = findAttr(span, "http.target");
                    if (http_method === 'OPTIONS')
                        continue;
                    if (EXCLUDES_ROUTES.includes(http_target)) {
                        continue;
                    }
                    const http_url = findAttr(span, "http.url");
                    const http_status = findAttr(span, "http.status_code");
                    spans_http.push(Object.assign(Object.assign({}, baseFields), { http_url: http_url, http_method: http_method, http_target: http_target, http_status: Number.isFinite(http_status) && (http_status || 0) >= 0 ? http_status : 0 }));
                }
                else if (spanType === "Database") {
                    const db_duration = findAttr(span, "db.duration");
                    const db_statement = findAttr(span, "db.statement");
                    const db_system = findAttr(span, "db.system");
                    const db_table = findAttr(span, "db.sql.table");
                    const db_user = findAttr(span, "db.user");
                    const db_name = findAttr(span, "db.name");
                    spans_database.push(Object.assign(Object.assign({}, baseFields), { db_system: db_system, db_statement: db_statement || null, db_duration: db_duration ? Number(db_duration) : duration_ns, db_table: db_table || null, db_operation: findAttr(span, "db.operation") || null, db_user: db_user || null, db_name: db_name || null }));
                }
            }
        }
    }
    return { spans_http, spans_database };
}
function formatCHDate(date) {
    return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}
function toCHDateTime64(nanos) {
    const date = new Date(Number(nanos) / 1e6);
    const iso = date.toISOString();
    return iso.replace('T', ' ').replace('Z', '');
}
function toEnumKind(kind) {
    const valid = new Set(['UNSPECIFIED', 'INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER']);
    return valid.has(kind) ? kind : 'UNSPECIFIED';
}
function findAttr(span, key) {
    if (!span.attributes)
        return null;
    const a = span.attributes.find((attr) => attr.key === key);
    if (!a || !a.value)
        return null;
    const v = a.value;
    if (v.stringValue !== undefined)
        return v.stringValue;
    if (v.intValue !== undefined)
        return Number(v.intValue);
    if (v.doubleValue !== undefined)
        return Number(v.doubleValue);
    if (v.boolValue !== undefined)
        return !!v.boolValue;
    return null;
}
function toUInt8Status(code) {
    if (typeof code === 'number')
        return Math.max(0, Math.min(2, code));
    if (typeof code === 'string') {
        const c = code.toUpperCase();
        if (c === 'OK')
            return 1;
        if (c === 'ERROR')
            return 2;
        return 0;
    }
    return 0;
}
function getSpanType(span) {
    const db_system = findAttr(span, "db.system");
    const http_method = findAttr(span, "http.method");
    const messaging_system = findAttr(span, "messaging.system");
    const rpc_system = findAttr(span, "rpc.system");
    if (db_system) {
        return 'Database';
    }
    if (http_method || findAttr(span, "http.status_code")) {
        return 'HTTP';
    }
    if (messaging_system) {
        return 'Messaging';
    }
    if (rpc_system) {
        return 'RPC';
    }
    if (span.kind === 1 || span.kind === "SPAN_KIND_INTERNAL") {
        return 'Internal';
    }
    return 'Unknown';
}
