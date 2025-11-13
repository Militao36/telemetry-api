"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogJobProcessor = void 0;
class LogJobProcessor {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async handle(job) {
        const { logs } = job.data;
        await this.clickHouseClient.insert({
            table: 'telemetry.logs',
            values: logs,
            format: 'JSONEachRow'
        });
    }
}
exports.LogJobProcessor = LogJobProcessor;
