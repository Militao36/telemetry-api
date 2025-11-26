import { clientRedis } from '../databases/redis';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = typeof target === 'function' ? target.name : target.constructor.name;

      let argsString = '';
      try {
        argsString = JSON.stringify(args);
      } catch (e) {
        argsString = String(args);
      }

      const hash = crypto.createHash('md5').update(argsString).digest('hex');

      const prefix = options.prefix || `cache:${className}:${propertyKey}`;
      const key = `${prefix}:${hash}`;
      const ttl = options.ttl || 60 * 5; // Default 5 minutes

      try {
        const cachedResult = await clientRedis.get(key);

        if (cachedResult) {
          return JSON.parse(cachedResult.toString());
        }
      } catch (error) {
        console.error(`[Cache] Error getting key ${key}:`, error);
      }

      const result = await originalMethod.apply(this, args);

      if (result !== undefined && result !== null) {
        try {
          await clientRedis.set(key, JSON.stringify(result), { EX: ttl });
        } catch (error) {
          console.error(`[Cache] Error setting key ${key}:`, error);
        }
      }

      return result;
    };

    return descriptor;
  };
}
