"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracesService = void 0;
class TracesService {
    constructor({ queueTraces, normalizeOTLP }) {
        this.queueTraces = queueTraces;
        this.normalizeOTLP = normalizeOTLP;
    }
    async create(idEmpresa, resourceSpans) {
        const spans = this.normalizeOTLP(resourceSpans);
        await this.queueTraces.add({
            idEmpresa,
            spans,
        });
    }
}
exports.TracesService = TracesService;
