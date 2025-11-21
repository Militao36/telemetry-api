import knex from 'knex';
import { PG_DATABASE, PG_HOST, PG_PASSWORD, PG_PORT, PG_USER } from '../../env';

export const databaseKnex = knex({
  client: 'pg',
  connection: {
    host: PG_HOST,
    port: Number(PG_PORT),
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
  },
});
