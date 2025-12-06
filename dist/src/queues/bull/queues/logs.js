"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogJobProcessor = void 0;
class LogJobProcessor {
    constructor({ clickHouseClient }) {
        this.clickHouseClient = clickHouseClient;
    }
    async handle(job) {
        const { logs, idEmpresa, idProject } = job.data;
        const values = logs.map(log => (Object.assign(Object.assign({}, log), { id_empresa: idEmpresa, project_id: idProject, attributes: JSON.stringify(log.attributes) })));
        await this.clickHouseClient.insert({
            table: 'telemetry.logs',
            values,
            format: 'JSONEachRow',
        });
    }
}
exports.LogJobProcessor = LogJobProcessor;
