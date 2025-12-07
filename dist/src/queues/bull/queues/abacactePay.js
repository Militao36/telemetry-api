"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbacatePayJobbProcessor = void 0;
const company_entity_js_1 = require("../../../entities/company.entity.js");
const env_js_1 = require("../../../env.js");
const container_js_1 = require("../../../container.js");
const luxon_1 = require("luxon");
class AbacatePayJobbProcessor {
    constructor() {
        this.companyService = null;
        this.abacatePayService = null;
        this.clientRedis = null;
        this.logger = null;
    }
    async handle(job) {
        try {
            this.abacatePayService = container_js_1.container.resolve('abacatePayService');
            this.companyService = container_js_1.container.resolve('companyService');
            this.clientRedis = container_js_1.container.resolve('clientRedis');
            this.logger = container_js_1.container.resolve('logger');
            const { payment: { id, amount }, company } = job.data;
            const key = await this.clientRedis.get(`abacatepay:waiting_payment:${company.id}`);
            if (key) {
                const cachedPayment = JSON.parse(key);
                if (cachedPayment.status === 'PAID') {
                    this.logger.info(`Payment for company ${company.id} already completed. No further processing needed.`);
                    return;
                }
            }
            const response = await this.abacatePayService.checkPaymentStatus(id);
            const data = response.data;
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
                [5990]: {
                    plan: company_entity_js_1.CompanyPlan.BASIC,
                    limitRegisters: 100000,
                },
                [9990]: {
                    plan: company_entity_js_1.CompanyPlan.COMPLETE,
                    limitRegisters: 250000,
                },
            };
            let plan = pricingMapper[amount];
            if (!plan) {
                plan = {
                    plan: company_entity_js_1.CompanyPlan.FREE,
                    limitRegisters: env_js_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN,
                };
            }
            if (data.status === 'PAID') {
                await this.companyService.updateCompanyBeforePayment(company.id, Object.assign(Object.assign({}, company), { plan: plan.plan, status: company_entity_js_1.CompanyStatus.ACTIVE, limitRegisters: plan.limitRegisters, expirationDate: luxon_1.DateTime.now().plus({ months: 1 }).toISODate() }));
                await this.clientRedis.set(`abacatepay:waiting_payment:${company.id}`, JSON.stringify({
                    companyId: company.id,
                    amount: data.amount,
                    createdAt: new Date().toISOString(),
                    status: data.status,
                }));
            }
        }
        catch (error) {
            console.log('AbacatePayJobbProcessor error', error);
        }
    }
}
exports.AbacatePayJobbProcessor = AbacatePayJobbProcessor;
