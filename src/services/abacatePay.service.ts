import { AxiosStatic } from 'axios';
import { BadRequest } from '../erros/BadRequest';
import { TOKEN_ABACATE_PAY, URL_ABACATE_PAY } from '../env';
import { CompanyEntity, CompanyPlan } from '../entities/company.entity';
import { RedisClientType } from 'redis';
import { Queue } from 'bull';
import { DateTime } from 'luxon';

export class AbacatePayService {
  axios: AxiosStatic;
  clientRedis: RedisClientType;
  queueAbacatePay: Queue;

  constructor({ axios, clientRedis, queueAbacatePay }) {
    this.axios = axios;
    this.clientRedis = clientRedis;
    this.queueAbacatePay = queueAbacatePay;
  }

  async generatePaymentQrCode(company: CompanyEntity, amount: number): Promise<string> {
    if (company.plan === CompanyPlan.FREE) {
      // free plan does not need payment processing
      return;
    }

    const currentDate = DateTime.now();
    const expirationDate = DateTime.fromISO(company.expirationDate);

    if (currentDate < expirationDate) {
      throw new BadRequest('Company plan is still active');
    }

    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + TOKEN_ABACATE_PAY,
        'Content-Type': 'application/json',
      },
      body: {
        amount: +amount,
        expiresIn: 60 * 3, // 3 minutes
        description: 'Pagamento da plataforma UnTelemetry!',
        customer: {
          name: company.name,
          cellphone: company.contactPhone,
          email: company.contactEmail,
          taxId: company.documentNumber,
        },
      },
    };

    const key = await this.clientRedis.get(`abacatepay:waiting_payment:${company.id}`);

    if (key) {
      const cachedPayment = JSON.parse(key as string);
      if (cachedPayment.status === 'PAID') {
        throw new BadRequest('Payment already completed');
      }
    }

    const response = await this.axios.post(`${URL_ABACATE_PAY}/pixQrCode/create`, options.body, {
      headers: options.headers,
    });

    if (response.status === 200) {
      const { data } = response.data;

      await this.clientRedis.set(
        `abacatepay:waiting_payment:${data.id}`,
        JSON.stringify({
          companyId: company.id,
          amount: data.amount,
          createdAt: new Date().toISOString(),
          status: data.status,
        }),
        {
          EX: 60 * 30, // 15 minutes
        },
      );

      await this.queueAbacatePay.add(
        {
          company,
          payment: data,
        },
        {
          delay: 15000,
          attempts: 10,
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      );

      return data.brCodeBase64;
    }

    throw new BadRequest('Error generating QR Code');
  }

  async checkPaymentStatus(paymentId: string): Promise<Record<string, any>> {
    const options = {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + TOKEN_ABACATE_PAY,
        'Content-Type': 'application/json',
      },
    };

    const response = await this.axios.get(`${URL_ABACATE_PAY}/pixQrCode/check?id=${paymentId}`, {
      headers: options.headers,
    });

    if (response.status === 200) {
      return response.data;
    }

    throw new BadRequest('Error generating QR Code');
  }
}
