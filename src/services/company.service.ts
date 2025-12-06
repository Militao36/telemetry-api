import { CompanyEntity } from '../entities/company.entity';
import { NotFound } from '../erros/NotFound';
import { CompanyRepository } from '../repositories/company.repository';

export class CompanyService {
  companyRepository: CompanyRepository;

  constructor({ companyRepository }) {
    this.companyRepository = companyRepository;
  }

  async create(data: CompanyEntity): Promise<CompanyEntity> {
    const company = new CompanyEntity(data);
    return this.companyRepository.create(company);
  }

  async update(id: string, updateData: Partial<CompanyEntity>): Promise<void> {
    await this.findById(id);
    await this.companyRepository.update(id, updateData);
  }

  async findById(id: string): Promise<CompanyEntity> {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new NotFound('Company not found');
    }

    return company;
  }

  async list(): Promise<CompanyEntity[]> {
    return this.companyRepository.list();
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.companyRepository.delete(id);
  }
}
