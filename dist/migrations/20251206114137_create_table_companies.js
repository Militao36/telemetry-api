"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const company_entity_1 = require("../src/entities/company.entity");
const env_1 = require("../src/env");
async function up(knex) {
    await knex.schema.createTable('companies', (table) => {
        table.string('id').primary().notNullable();
        table.string('name').notNullable();
        table.string('documentNumber').notNullable();
        table.string('contactPhone').notNullable();
        table.string('contactEmail').notNullable();
        table.enum('status', [company_entity_1.CompanyStatus.ACTIVE, company_entity_1.CompanyStatus.INACTIVE]).notNullable().defaultTo(company_entity_1.CompanyStatus.INACTIVE);
        table.enum('plan', [company_entity_1.CompanyPlan.FREE, company_entity_1.CompanyPlan.BASIC, company_entity_1.CompanyPlan.COMPLETE]).notNullable().defaultTo(company_entity_1.CompanyPlan.FREE);
        table.integer('countRegisters').defaultTo(0);
        table.integer('countAlerts').defaultTo(env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN);
        table.integer('limitRegisters').defaultTo(env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN);
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTable('companies');
}
