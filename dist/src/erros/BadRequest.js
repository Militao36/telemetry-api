"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequest = void 0;
const BaseError_1 = require("./BaseError");
class BadRequest extends BaseError_1.BaseError {
    constructor(message, erros, statusCode = 400) {
        super(message, erros);
        this.statusCode = statusCode;
    }
}
exports.BadRequest = BadRequest;
