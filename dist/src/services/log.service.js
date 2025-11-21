"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const env_1 = require("../env");
const lua_1 = require("../databases/redis/lua");
class LogService {
    constructor({ queueLogs, logger, clientRedis, normalizeLog }) {
        this.queueLogs = queueLogs;
        this.normalizeLog = normalizeLog;
        this.clientRedis = clientRedis;
        this.LIMIT_ITEM_QUEUE = env_1.LIMIT_ITEM_QUEUE_DEFAULT;
        this.logger = logger;
    }
    async create(idEmpresa, logsRaw) {
        const logs = this.normalizeLog(logsRaw);
        if (logs.length === 0) {
            return;
        }
        const countKey = `log_count:${idEmpresa}`;
        const logsKey = `log_logs:${idEmpresa}`;
        try {
            const result = (await this.clientRedis.eval(lua_1.ADD_ITEM_SCRIPT, {
                keys: [countKey, logsKey],
                arguments: [this.LIMIT_ITEM_QUEUE.toString(), JSON.stringify(logs), logs.length.toString()],
            }));
            const [shouldQueue, logsToQueue] = result;
            if (shouldQueue === 1 && logsToQueue) {
                const parsedSpans = JSON.parse(logsToQueue);
                if (parsedSpans.length > 0) {
                    await this.queueLogs.add({
                        idEmpresa,
                        spans: parsedSpans,
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
            throw error;
        }
    }
}
exports.LogService = LogService;
