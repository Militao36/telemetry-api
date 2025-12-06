import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.integer('countRegisters').defaultTo(0);
    table.integer('countAlerts').defaultTo(0);
    table.integer('limitRegisters').defaultTo(100000);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("countRegisters");
    table.dropColumn("countAlerts");
    table.dropColumn("limitRegisters");
  });
}

