import { clientRedis } from '../databases/redis';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  keyBuilder?: (...args: any[]) => string;
}

export const DEFAULT_CACHE_TTL_SECONDS = 60;

function stableSerialize(value: any): string {
  const normalize = (input: any): any => {
    if (input === null || input === undefined) return input;

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (typeof input === 'bigint') {
      return input.toString();
    }

    if (Array.isArray(input)) {
      return input.map(normalize);
    }

    if (typeof input === 'object') {
      const sortedKeys = Object.keys(input).sort();
      const output: Record<string, any> = {};

      for (const key of sortedKeys) {
        output[key] = normalize(input[key]);
      }

      return output;
    }

    return input;
  };

  return JSON.stringify(normalize(value));
}

export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = typeof target === 'function' ? target.name : target.constructor.name;

      let rawKey = '';
      try {
        rawKey = options.keyBuilder ? options.keyBuilder.apply(this, args) : stableSerialize(args);
      } catch (_error) {
        rawKey = String(args);
      }

      const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const prefix = options.prefix || `cache:${className}:${propertyKey}`;
      const key = `${prefix}:${hash}`;
      const ttl = options.ttl || DEFAULT_CACHE_TTL_SECONDS;

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
