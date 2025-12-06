import { CompanyEntity, CompanyPlan } from '../entities/company.entity';
import { NotFound } from '../erros/NotFound';
import { CompanyRepository } from '../repositories/company.repository';
import { AbacatePayService } from './abacatePay.service';

export class CompanyService {
  companyRepository: CompanyRepository;
  abacatePayService: AbacatePayService

  constructor({ companyRepository, abacatePayService }) {
    this.companyRepository = companyRepository;
    this.abacatePayService = abacatePayService;
  }

  async generatePay(id: string, plan: CompanyPlan): Promise<string> {
    const pricingMapper = {
      [CompanyPlan.BASIC]: 799,
      [CompanyPlan.COMPLETE]: 1399,
    }

    const company = await this.findById(id);

    const payQrcode = await this.abacatePayService.generatePaymentQrCode(company, pricingMapper[plan]);

    return payQrcode;
  }

  async incrementCountRegisters(id: string, count: number = 1) {
    return await this.companyRepository.incrementCountRegisters(id, count);
  }

  async create(data: CompanyEntity): Promise<CompanyEntity> {
    const company = new CompanyEntity(data);
    return this.companyRepository.create(company);
  }

  async update(id: string, updateData: Partial<CompanyEntity>): Promise<void> {
    const exists = await this.findById(id);
    await this.companyRepository.update(id, {
      ...updateData,
      plan: exists.plan,
      countRegisters: exists.countRegisters,
      limitRegisters: exists.limitRegisters,
      status: exists.status,
    });
  }

  async findById(id: string): Promise<CompanyEntity> {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new NotFound('Company not found');
    }

    return company;
  }
}
