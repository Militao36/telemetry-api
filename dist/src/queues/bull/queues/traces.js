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
                table: 'telemetry.spans_database',
                values: spans_database,
                format: 'JSONEachRow',
            });
        }
        if (spans_http.length) {
            await this.clickHouseClient.insert({
                table: 'telemetry.spans_http',
                values: spans_http,
                format: 'JSONEachRow',
            });
        }
    }
}
exports.TraceJobProcessor = TraceJobProcessor;
