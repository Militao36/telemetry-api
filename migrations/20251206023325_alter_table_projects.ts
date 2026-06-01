import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('projects', (table) => {
    table.boolean('active').defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('projects', (table) => {
    table.boolean('active').defaultTo(true);
  });
}
