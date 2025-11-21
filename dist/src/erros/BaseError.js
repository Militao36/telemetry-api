"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
class BaseError extends Error {
    constructor(message, erros) {
        super(message);
        this.message = message || 'Internal server error';
        this.erros = erros !== null && erros !== void 0 ? erros : [];
        this.statusCode = 500;
    }
}
exports.BaseError = BaseError;
