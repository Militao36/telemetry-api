"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbacatePayService = void 0;
const BadRequest_1 = require("../erros/BadRequest");
const env_1 = require("../env");
class AbacatePayService {
    constructor({ axios, companyService }) {
        this.axios = axios;
        this.companyService = companyService;
    }
    async generatePaymentQrCode(idEmpresa, amount) {
        const company = await this.companyService.findById(idEmpresa);
        const options = {
            method: 'POST',
            headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
            body: {
                amount: +amount,
                expiresIn: 60 * 3,
                description: 'Pagamento da plataforma UnTelemetry!',
                customer: {
                    name: company.name,
                    cellphone: company.contactPhone,
                    email: company.contactEmail,
                    taxId: company.documentNumber
                },
            }
        };
        const response = await this.axios.post(`${env_1.URL_ABACATE_PAY}/pixQrCode/create`, options.body, {
            headers: options.headers
        });
        if (response.status === 200) {
            const data = response.data;
            return data.brCodeBase64;
        }
        throw new BadRequest_1.BadRequest('Error generating QR Code');
    }
}
exports.AbacatePayService = AbacatePayService;
