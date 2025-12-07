"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbacatePayService = void 0;
const BadRequest_1 = require("../erros/BadRequest");
const env_1 = require("../env");
const company_entity_1 = require("../entities/company.entity");
const luxon_1 = require("luxon");
class AbacatePayService {
    constructor({ axios, clientRedis, queueAbacatePay }) {
        this.axios = axios;
        this.clientRedis = clientRedis;
        this.queueAbacatePay = queueAbacatePay;
    }
    async generatePaymentQrCode(company, amount) {
        if (company.plan === company_entity_1.CompanyPlan.FREE) {
            return;
        }
        const currentDate = luxon_1.DateTime.now();
        const expirationDate = luxon_1.DateTime.fromISO(company.expirationDate);
        if (currentDate < expirationDate) {
            throw new BadRequest_1.BadRequest('Company plan is still active');
        }
        const options = {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + env_1.TOKEN_ABACATE_PAY,
                'Content-Type': 'application/json'
            },
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
        const key = await this.clientRedis.get(`abacatepay:waiting_payment:${company.id}`);
        if (key) {
            const cachedPayment = JSON.parse(key);
            if (cachedPayment.status === 'PAID') {
                throw new BadRequest_1.BadRequest('Payment already completed');
            }
        }
        const response = await this.axios.post(`${env_1.URL_ABACATE_PAY}/pixQrCode/create`, options.body, {
            headers: options.headers
        });
        if (response.status === 200) {
            const { data } = response.data;
            await this.clientRedis.set(`abacatepay:waiting_payment:${data.id}`, JSON.stringify({
                companyId: company.id,
                amount: data.amount,
                createdAt: new Date().toISOString(),
                status: data.status,
            }), {
                EX: 60 * 30,
            });
            await this.queueAbacatePay.add({
                company,
                payment: data,
            }, {
                delay: 15000,
                attempts: 10,
            });
            return data.brCodeBase64;
        }
        throw new BadRequest_1.BadRequest('Error generating QR Code');
    }
    async checkPaymentStatus(paymentId) {
        const options = {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + env_1.TOKEN_ABACATE_PAY,
                'Content-Type': 'application/json'
            },
        };
        const response = await this.axios.get(`${env_1.URL_ABACATE_PAY}/pixQrCode/check?id=${paymentId}`, {
            headers: options.headers
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new BadRequest_1.BadRequest('Error generating QR Code');
    }
}
exports.AbacatePayService = AbacatePayService;
