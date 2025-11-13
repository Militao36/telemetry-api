"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceJobProcessor = void 0;
class TraceJobProcessor {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async handle(job) {
        const { spans, idEmpresa } = job.data;
        if (!spans.length)
            return;
        const rows = spans.map((span) => {
            var _a, _b, _c;
            const trace_id = this.padHex(span.trace_id, 32);
            const span_id = this.padHex(span.span_id, 16);
            const parent_span_id = this.padHex(span.parent_span_id || '', 16) || '0000000000000000';
            const { method, status } = this.extractHttpFromArray(JSON.parse(span.attributes || '{}'));
            return {
                id_empresa: idEmpresa,
                service_name: span.service_name || 'unknown',
                service_version: (_a = span.service_version) !== null && _a !== void 0 ? _a : null,
                service_environment: (_b = span.service_environment) !== null && _b !== void 0 ? _b : null,
                trace_id,
                span_id,
                parent_span_id,
                name: span.name || '',
                kind: this.toEnumKind(span.kind ? String(span.kind) : 'UNSPECIFIED'),
                start_time: this.toDateTime64String(new Date(span.start_time)),
                end_time: this.toDateTime64String(new Date(span.end_time)),
                duration_ns: Number.isFinite(span.duration_ns) ? span.duration_ns : 0,
                status_code: this.toUInt8Status(span.status_code),
                status_message: span.status_message || '',
                http_method: method,
                http_status: Number.isFinite(status) && (status || 0) >= 0 ? status : 0,
                http_target: span.http_target || '',
                http_route: span.http_route || '',
                db_system: span.db_system || '',
                db_statement: span.db_statement || '',
                db_duration: (_c = span.db_duration) !== null && _c !== void 0 ? _c : 0,
                attributes: span.attributes,
            };
        });
        await this.clickHouseClient.insert({
            table: 'telemetry.spans_raw',
            values: rows,
            format: 'JSONEachRow'
        });
    }
    toEnumKind(kind) {
        const valid = new Set(['UNSPECIFIED', 'INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER']);
        return valid.has(kind) ? kind : 'UNSPECIFIED';
    }
    padHex(s, len) {
        const v = (s || '').toLowerCase().replace(/[^0-9a-f]/g, '');
        if (v.length >= len)
            return v.slice(0, len);
        return v.padStart(len, '0');
    }
    toUInt8Status(code) {
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
    toDateTime64String(d) {
        const msEpoch = d.getTime();
        const yyyy = d.getUTCFullYear();
        const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const HH = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ss = String(d.getUTCSeconds()).padStart(2, '0');
        const remainderMs = msEpoch % 1000;
        const nanos = Math.round(remainderMs * 1e6);
        const frac = String(nanos).padStart(9, '0');
        return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}.${frac}`;
    }
    extractHttpFromArray(attributes) {
        if (!Array.isArray(attributes))
            return { method: null, status: null };
        let method = null;
        let status = null;
        for (const attr of attributes) {
            if (!(attr === null || attr === void 0 ? void 0 : attr.key) || !(attr === null || attr === void 0 ? void 0 : attr.value))
                continue;
            if (attr.key === "http.method" && attr.value.stringValue !== undefined) {
                method = attr.value.stringValue;
            }
            if (attr.key === "http.status_code") {
                if (attr.value.intValue !== undefined) {
                    status = Number(attr.value.intValue);
                }
                if (attr.value.doubleValue !== undefined) {
                    status = Number(attr.value.doubleValue);
                }
            }
        }
        return { method, status };
    }
}
exports.TraceJobProcessor = TraceJobProcessor;
