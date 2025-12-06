"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable("users", (table) => {
        table.integer('countRegisters').defaultTo(0);
        table.integer('countAlerts').defaultTo(0);
        table.integer('limitRegisters').defaultTo(100000);
    });
}
async function down(knex) {
    await knex.schema.alterTable("users", (table) => {
        table.dropColumn("countRegisters");
        table.dropColumn("countAlerts");
        table.dropColumn("limitRegisters");
    });
}
