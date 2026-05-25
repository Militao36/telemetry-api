import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('projects', (table) => {
    table.jsonb('redactionFields').notNullable().defaultTo(knex.raw("'[]'::jsonb"));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('projects', (table) => {
    table.dropColumn('redactionFields');
  });
}
