"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOTLP = normalizeOTLP;
function nanosToDate(nanos) {
    return new Date(Number(nanos) / 1e6);
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
function normalizeOTLP(resourceSpans) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const all = [];
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
                const start = nanosToDate(startNano);
                const end = nanosToDate(endNano);
                const status = span.status || {};
                all.push({
                    trace_id: Buffer.from(traceId).toString("hex"),
                    span_id: Buffer.from(spanId).toString("hex"),
                    parent_span_id: parentSpanId ? Buffer.from(parentSpanId).toString("hex") : "0000000000000000",
                    service_name: serviceName,
                    service_version: serviceVersion,
                    service_environment: environment,
                    name: span.name,
                    kind: (_p = span.kind) !== null && _p !== void 0 ? _p : 0,
                    start_time: start,
                    end_time: end,
                    duration_ns: Number(endNano) - Number(startNano),
                    status_code: (_q = status.code) !== null && _q !== void 0 ? _q : 0,
                    status_message: (_r = status.message) !== null && _r !== void 0 ? _r : "",
                    http_method: findAttr(span, "http.method"),
                    http_route: findAttr(span, "http.route"),
                    http_target: findAttr(span, "http.target"),
                    http_status: findAttr(span, "http.status_code"),
                    db_system: findAttr(span, "db.system"),
                    db_statement: findAttr(span, "db.statement"),
                    db_duration: findAttr(span, "db.duration"),
                    attributes: JSON.stringify(span.attributes || []),
                    ingestion_time: new Date()
                });
            }
        }
    }
    return all;
}
