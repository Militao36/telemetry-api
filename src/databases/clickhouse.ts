import { createClient } from '@clickhouse/client'

import {
  CLICKHOUSE_DATABASE,
  CLICKHOUSE_PASSWORD,
  CLICKHOUSE_URL,
  CLICKHOUSE_USER,
} from '../env';

export const clientClickHouse = createClient({
  url: CLICKHOUSE_URL,
  username: CLICKHOUSE_USER,
  password: CLICKHOUSE_PASSWORD,
  database: CLICKHOUSE_DATABASE,
});
