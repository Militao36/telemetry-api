"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseKnex = void 0;
const knex_1 = __importDefault(require("knex"));
const env_1 = require("../../env");
exports.databaseKnex = (0, knex_1.default)({
    client: 'pg',
    connection: {
        host: env_1.PG_HOST,
        port: Number(env_1.PG_PORT),
        user: env_1.PG_USER,
        password: env_1.PG_PASSWORD,
        database: env_1.PG_DATABASE,
    },
});
