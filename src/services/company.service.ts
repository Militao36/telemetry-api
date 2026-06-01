import { DateTime } from 'luxon';
import { CompanyEntity, CompanyPlan, CompanyStatus } from '../entities/company.entity';
import { NotFound } from '../erros/NotFound';
import { CompanyRepository } from '../repositories/company.repository';
import { AbacatePayService } from './abacatePay.service';
import { DEFAULT_LIMIT_REGISTERS_FREE_PLAN } from '../env';
import { Logger } from 'pino';

export class CompanyService {
  companyRepository: CompanyRepository;
  abacatePayService: AbacatePayService;
  logger: Logger;

  constructor({ companyRepository, abacatePayService, logger }) {
    this.companyRepository = companyRepository;
    this.abacatePayService = abacatePayService;
    this.logger = logger;
  }

  async generatePay(id: string, plan: CompanyPlan): Promise<string> {
    const pricingMapper = {
      [CompanyPlan.BASIC]: 5990,
      [CompanyPlan.COMPLETE]: 9990,
    };

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
    const safeUpdateData = this.pickUpdateData(updateData);

    await this.companyRepository.update(id, {
      ...safeUpdateData,
      plan: exists.plan,
      countRegisters: exists.countRegisters,
      limitRegisters: exists.limitRegisters,
      status: exists.status,
      expirationDate: exists.expirationDate,
    });
  }

  async updateCompanyBeforePayment(id: string, company: CompanyEntity): Promise<void> {
    await this.companyRepository.update(id, company);
  }

  async resetCountRegisters(id: string): Promise<void> {
    const company = await this.findById(id);

    const currentDate = DateTime.now();
    const expirationDate = DateTime.fromISO(company.expirationDate);

    if (currentDate >= expirationDate) {
      let newLimitRegisters = company.limitRegisters;

      if (company.plan === CompanyPlan.FREE) {
        newLimitRegisters = DEFAULT_LIMIT_REGISTERS_FREE_PLAN;
      }

      await this.companyRepository.update(id, {
        countRegisters: 0,
        limitRegisters: newLimitRegisters,
        status: CompanyStatus.INACTIVE,
      });
    }

    if (company.countRegisters >= company.limitRegisters && company.status !== CompanyStatus.INACTIVE) {
      this.logger.warn(`Company has exceeded the limit of registers: ${company.countRegisters}/${company.limitRegisters}`);
      await this.companyRepository.update(id, {
        status: CompanyStatus.INACTIVE,
      });
    }
  }

  async findById(id: string): Promise<CompanyEntity> {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      throw new NotFound('Company not found');
    }

    return company;
  }

  private pickUpdateData(updateData: Partial<CompanyEntity>): Partial<CompanyEntity> {
    return Object.fromEntries(
      Object.entries({
        name: updateData.name,
        documentNumber: updateData.documentNumber,
        contactPhone: updateData.contactPhone,
        contactEmail: updateData.contactEmail,
      }).filter(([, value]) => value !== undefined),
    ) as Partial<CompanyEntity>;
  }
}
