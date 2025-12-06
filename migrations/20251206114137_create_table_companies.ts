import type { Knex } from "knex";
import { CompanyPlan, CompanyStatus } from "../src/entities/company.entity";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('companies', (table) => {
    table.string('idEmpresa').notNullable()
    table.string('id').primary().notNullable()
    table.string('name').notNullable()
    table.string('documentNumber').notNullable()
    table.string('contactPhone').notNullable()
    table.string('contactEmail').notNullable()
    table.enum('status', [CompanyStatus.ACTIVE, CompanyStatus.INACTIVE]).notNullable().defaultTo(CompanyStatus.INACTIVE)
    table.enum('plan', [CompanyPlan.FREE, CompanyPlan.BASIC, CompanyPlan.COMPLETE]).notNullable().defaultTo(CompanyPlan.FREE)
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('companies')
}

