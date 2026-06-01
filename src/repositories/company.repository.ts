import { Knex } from 'knex';
import { CompanyEntity } from '../entities/company.entity';

export class CompanyRepository {
  private databaseKnex: Knex;

  constructor({ databaseKnex }) {
    this.databaseKnex = databaseKnex;
  }

  async incrementCountRegisters(id: string, count: number = 1) {
    return (await this.databaseKnex<CompanyEntity>('companies').where({ id }).increment('countRegisters', count).returning('*')) as CompanyEntity[];
  }

  async create(data: CompanyEntity): Promise<CompanyEntity> {
    const [company] = await this.databaseKnex<CompanyEntity>('companies').insert(data).returning('*');
    return new CompanyEntity(company, company.id);
  }

  async update(id: string, updateData: Partial<CompanyEntity>): Promise<CompanyEntity> {
    const [company] = await this.databaseKnex<CompanyEntity>('companies').where({ id }).update(updateData).returning('*');
    return new CompanyEntity(company, company.id);
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    const company = await this.databaseKnex<CompanyEntity>('companies').where({ id }).first();
    if (!company) {
      return null;
    }
    return new CompanyEntity(company, company.id);
  }
}
