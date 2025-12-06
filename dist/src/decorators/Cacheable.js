"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cacheable = Cacheable;
const redis_1 = require("../databases/redis");
const crypto_1 = __importDefault(require("crypto"));
function Cacheable(options = {}) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const className = typeof target === 'function' ? target.name : target.constructor.name;
            let argsString = '';
            try {
                argsString = JSON.stringify(args);
            }
            catch (e) {
                argsString = String(args);
            }
            const hash = crypto_1.default.createHash('md5').update(argsString).digest('hex');
            const prefix = options.prefix || `cache:${className}:${propertyKey}`;
            const key = `${prefix}:${hash}`;
            const ttl = options.ttl || 60 * 5;
            try {
                const cachedResult = await redis_1.clientRedis.get(key);
                if (cachedResult) {
                    return JSON.parse(cachedResult.toString());
                }
            }
            catch (error) {
                console.error(`[Cache] Error getting key ${key}:`, error);
            }
            const result = await originalMethod.apply(this, args);
            if (result !== undefined && result !== null) {
                try {
                    await redis_1.clientRedis.set(key, JSON.stringify(result), { EX: ttl });
                }
                catch (error) {
                    console.error(`[Cache] Error setting key ${key}:`, error);
                }
            }
            return result;
        };
        return descriptor;
    };
}
