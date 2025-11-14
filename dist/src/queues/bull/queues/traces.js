"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceJobProcessor = void 0;
class TraceJobProcessor {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async handle(job) {
        const { spans_database, spans_http } = job.data;
        if (spans_database.length) {
            await this.clickHouseClient.insert({
                table: 'telemetry.spans_http',
                values: spans_database,
                format: 'JSONEachRow'
            });
        }
        else if (spans_http.length) {
            await this.clickHouseClient.insert({
                table: 'telemetry.spans_database',
                values: spans_http,
                format: 'JSONEachRow'
            });
        }
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
