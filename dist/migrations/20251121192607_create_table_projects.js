"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    return knex.schema.dropTable('projects');
}
