import { AxiosStatic } from "axios";
import { BadRequest } from "../erros/BadRequest";
import { TOKEN_ABACATE_PAY, URL_ABACATE_PAY } from "../env";
import { CompanyEntity } from "../entities/company.entity";

export class AbacatePayService {
  axios: AxiosStatic

  constructor({ axios }) {
    this.axios = axios;
  }

  async generatePaymentQrCode(company: CompanyEntity, amount: number): Promise<string> {
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + TOKEN_ABACATE_PAY,
        'Content-Type': 'application/json'
      },
      body: {
        amount: +amount,
        expiresIn: 60 * 3, // 3 minutes
        description: 'Pagamento da plataforma UnTelemetry!',
        customer: {
          name: company.name,
          cellphone: company.contactPhone,
          email: company.contactEmail,
          taxId: company.documentNumber
        },
      }
    };

    const response = await this.axios.post(`${URL_ABACATE_PAY}/pixQrCode/create`, options.body, {
      headers: options.headers
    })

    if (response.status === 200) {
      const { data } = response.data;

      return data.brCodeBase64;
    }

    throw new BadRequest('Error generating QR Code');
  }
}