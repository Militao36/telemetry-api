"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp = void 0;
const now = process.hrtime.bigint();
const seconds = Number(now / BigInt(1000000000));
const nanos = Number(now % BigInt(1000000000));
const timestamp = `${new Date(seconds * 1000).toISOString().replace('Z', '')}.${nanos.toString().padStart(9, '0')}`;
exports.timestamp = timestamp;
