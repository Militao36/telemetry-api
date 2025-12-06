import { AxiosStatic } from "axios";
import { CompanyService } from "./company.service";
import { BadRequest } from "../erros/BadRequest";
import { URL_ABACATE_PAY } from "../env";

export class AbacatePayService {
  axios: AxiosStatic
  companyService: CompanyService

  constructor({ axios, companyService }) {
    this.axios = axios;
    this.companyService = companyService;
  }

  async generatePaymentQrCode(idEmpresa: string, amount: number): Promise<string> {
    const company = await this.companyService.findById(idEmpresa);

    const options = {
      method: 'POST',
      headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
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
      const data = response.data;

      return data.brCodeBase64;
    }

    throw new BadRequest('Error generating QR Code');
  }
}