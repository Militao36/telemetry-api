"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientRedis = void 0;
const redis_1 = require("redis");
const env_1 = require("../env");
const clientRedis = (0, redis_1.createClient)({
    username: 'default',
    password: env_1.REDIS_PASSWORD,
    url: `redis://:${env_1.REDIS_PASSWORD}@${env_1.REDIS_HOST}:${env_1.REDIS_PORT}`,
});
exports.clientRedis = clientRedis;
clientRedis.connect();
