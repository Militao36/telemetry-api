"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
const crypto_1 = require("crypto");
const luxon_1 = require("luxon");
class Entity {
    constructor(body, id) {
        if (id === null || id === undefined || id === '') {
            this.id = (0, crypto_1.randomUUID)();
            this.createdAt = luxon_1.DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss');
            this.updatedAt = luxon_1.DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss');
        }
        else {
            this.id = id;
            this.updatedAt = luxon_1.DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss');
        }
    }
}
exports.Entity = Entity;
