import Bull from 'bull';
import { QueueInterface } from '../queue.interface.js';
import { ClickHouseClient } from '@clickhouse/client';
import { NormalizedLog } from '../utils/normalizeLog.js';
import { CompanyService } from '../../../services/company.service.js';
import { AbacatePayService } from '../../../services/abacatePay.service.js';
import { CompanyEntity, CompanyPlan, CompanyStatus } from '../../../entities/company.entity.js';
import { DEFAULT_LIMIT_REGISTERS_FREE_PLAN } from '../../../env.js';
import { RedisClientType } from 'redis';
import { container } from '../../../container.js';
import { DateTime } from 'luxon';
import { Logger } from 'pino';


export interface IAbacatePayJobData {
  id: string;
  amount: number;
  status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED';
  devMode: boolean;
  brCode: string;
  brCodeBase64: string;
  platformFee: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}


export class AbacatePayJobbProcessor implements QueueInterface {
  companyService: CompanyService
  abacatePayService: AbacatePayService
  clientRedis: RedisClientType
  logger: Logger
  constructor() {
    this.companyService = null;
    this.abacatePayService = null;
    this.clientRedis = null;
    this.logger = null;
  }

  async handle(
    job: Bull.Job<{
      company: CompanyEntity,
      payment: IAbacatePayJobData
    }>
  ): Promise<void> {
    try {
      this.abacatePayService = container.resolve<AbacatePayService>('abacatePayService');
      this.companyService = container.resolve<CompanyService>('companyService');
      this.clientRedis = container.resolve<RedisClientType>('clientRedis');
      this.logger = container.resolve<Logger>('logger');

      const { payment: { id, amount }, company } = job.data


      const key = await this.clientRedis.get(`abacatepay:waiting_payment:${company.id}`);

      if (key) {
        const cachedPayment = JSON.parse(key as string);
        if (cachedPayment.status === 'PAID') {
          this.logger.info(`Payment for company ${company.id} already completed. No further processing needed.`);
          return;
        }
      }

      const response = await this.abacatePayService.checkPaymentStatus(id);

      const data = response.data

      if (['PENDING'].includes(data.status)) {
        await job.queue.add({
          company,
          payment: job.data.payment,
        }, {
          delay: 15000,
          attempts: 10,
        });

        return;
      }

      if (['EXPIRED', 'CANCELLED', 'REFUNDED'].includes(data.status)) {
        await this.clientRedis.set(`abacatepay:waiting_payment:${company.id}`, JSON.stringify({
          companyId: company.id,
          amount: data.amount,
          createdAt: new Date().toISOString(),
          status: data.status,
        }));
        return;
      }

      const pricingMapper = {
        [7990]: {
          plan: CompanyPlan.BASIC,
          limitRegisters: 100000,
        },
        [13990]: {
          plan: CompanyPlan.COMPLETE,
          limitRegisters: 250000,
        },
      }

      let plan = pricingMapper[amount]

      if (!plan) {
        plan = {
          plan: CompanyPlan.FREE,
          limitRegisters: DEFAULT_LIMIT_REGISTERS_FREE_PLAN,
        }
      }

      if (data.status === 'PAID') {
        await this.companyService.updateCompanyBeforePayment(company.id, {
          ...company,
          plan: plan.plan,
          status: CompanyStatus.ACTIVE,
          limitRegisters: plan.limitRegisters,
          expirationDate: DateTime.now().plus({ months: 1 }).toISODate() as string,
        });

        await this.clientRedis.set(`abacatepay:waiting_payment:${company.id}`, JSON.stringify({
          companyId: company.id,
          amount: data.amount,
          createdAt: new Date().toISOString(),
          status: data.status,
        }));
      }

    } catch (error) {
      console.log('AbacatePayJobbProcessor error', error);
    }
  }
}
