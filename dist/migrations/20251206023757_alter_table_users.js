"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.boolean('active').defaultTo(true);
    });
}
async function down(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.boolean('active').defaultTo(true);
    });
}
