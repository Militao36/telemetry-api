import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '../../env';

const clientRedis = createClient({
  username: 'default',
  password: REDIS_PASSWORD,
  url: `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`,
});

clientRedis.connect();

export { clientRedis };
