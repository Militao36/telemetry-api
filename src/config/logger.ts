import LoggerPino from 'pino';
import { LOG_LEVEL } from '../env';

export const logger = LoggerPino({
  level: LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});
