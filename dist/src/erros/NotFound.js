"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
const BaseError_1 = require("./BaseError");
class NotFound extends BaseError_1.BaseError {
    constructor(message, erros, statusCode = 404) {
        super(message, erros);
        this.statusCode = statusCode;
    }
}
exports.NotFound = NotFound;
