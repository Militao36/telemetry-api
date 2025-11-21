import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('idEmpresa').notNullable();
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.string('enviroment').notNullable();
    table.string('languageOrFramework').notNullable();
    table.string('token').notNullable().unique();
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();

    table.index(['idEmpresa'], 'idx_projects_idEmpresa');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('projects');
}
