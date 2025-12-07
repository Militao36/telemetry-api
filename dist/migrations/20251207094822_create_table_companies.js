"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('companies', (table) => {
        table.dateTime('expirationDate').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.alterTable('companies', (table) => {
        table.dropColumn('expirationDate');
    });
}
