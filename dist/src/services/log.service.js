"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const env_1 = require("../env");
const log_1 = require("../databases/redis/lua/log");
const company_entity_1 = require("../entities/company.entity");
class LogService {
    constructor({ queueLogs, logger, logsRepository, clientRedis, normalizeLog, companyService }) {
        this.queueLogs = queueLogs;
        this.normalizeLog = normalizeLog;
        this.clientRedis = clientRedis;
        this.LIMIT_ITEM_QUEUE = env_1.LIMIT_ITEM_QUEUE_DEFAULT;
        this.logger = logger;
        this.logsRepository = logsRepository;
        this.companyService = companyService;
    }
    async create(idEmpresa, idProject, logsRaw) {
        const logs = this.normalizeLog(idProject, idEmpresa, logsRaw);
        await this.companyService.resetCountRegisters(idEmpresa);
        const company = await this.companyService.findById(idEmpresa);
        if (company.status === company_entity_1.CompanyStatus.INACTIVE) {
            this.logger.warn(`Company ${idEmpresa} is inactive. Skipping trace processing.`);
            return;
        }
        const countLogs = logs.length;
        await this.companyService.incrementCountRegisters(idEmpresa, countLogs);
        if (countLogs === 0) {
            return;
        }
        const countKey = `log_count:${idEmpresa}`;
        const logsKey = `log_logs:${idEmpresa}`;
        try {
            const result = (await this.clientRedis.eval(log_1.ADD_LOG_SCRIPT, {
                keys: [countKey, logsKey],
                arguments: ['10', JSON.stringify(logs), logs.length.toString()],
            }));
            const [shouldQueue, logsToQueue] = result;
            if (shouldQueue === 1 && logsToQueue) {
                const parsedLogs = JSON.parse(logsToQueue);
                if (parsedLogs.length > 0) {
                    await this.queueLogs.add({
                        idEmpresa,
                        idProject,
                        logs: parsedLogs,
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Error processing logs for company ${idEmpresa}: ${error}`);
            throw error;
        }
    }
    async list(idEmpresa, idProject, qs) {
        return await this.logsRepository.list(idEmpresa, idProject, qs);
    }
}
exports.LogService = LogService;
