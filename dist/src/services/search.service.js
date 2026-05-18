"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
class SearchService {
    constructor({ requestsRepository, queriesRepository }) {
        this.requestsRepository = requestsRepository;
        this.queriesRepository = queriesRepository;
    }
    async list(idEmpresa, idProject, qs) {
        var _a, _b, _c, _d, _e;
        const normalizedFilters = Object.assign(Object.assign({}, qs), { type: qs.type, httpFilter: {
                method: ((_a = qs.httpFilter) === null || _a === void 0 ? void 0 : _a.method) || qs.method,
                statusCode: ((_b = qs.httpFilter) === null || _b === void 0 ? void 0 : _b.statusCode) || qs.statusCode,
                pathContains: ((_c = qs.httpFilter) === null || _c === void 0 ? void 0 : _c.pathContains) || qs.pathContains || qs.q,
            }, databaseFilter: {
                queryContains: ((_d = qs.databaseFilter) === null || _d === void 0 ? void 0 : _d.queryContains) || qs.queryContains,
                tableName: ((_e = qs.databaseFilter) === null || _e === void 0 ? void 0 : _e.tableName) || qs.tableName,
            }, limit: qs.limit, offset: qs.offset, environment: qs.environment, traceId: qs.traceId, startTimeFrom: qs.startTimeFrom, startTimeTo: qs.startTimeTo });
        if (normalizedFilters.type === 'HTTP') {
            return this.requestsRepository.list(idEmpresa, idProject, normalizedFilters);
        }
        if (normalizedFilters.type === 'DATABASE') {
            return this.queriesRepository.list(idEmpresa, idProject, normalizedFilters);
        }
        return [];
    }
}
exports.SearchService = SearchService;
