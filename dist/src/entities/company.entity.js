"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyEntity = exports.CompanyPlan = exports.CompanyStatus = void 0;
const env_1 = require("../env");
const Entity_1 = require("./base/Entity");
var CompanyStatus;
(function (CompanyStatus) {
    CompanyStatus["ACTIVE"] = "active";
    CompanyStatus["INACTIVE"] = "inactive";
})(CompanyStatus || (exports.CompanyStatus = CompanyStatus = {}));
var CompanyPlan;
(function (CompanyPlan) {
    CompanyPlan["FREE"] = "free";
    CompanyPlan["BASIC"] = "basic";
    CompanyPlan["COMPLETE"] = "complete";
})(CompanyPlan || (exports.CompanyPlan = CompanyPlan = {}));
class CompanyEntity extends Entity_1.Entity {
    constructor(body, id) {
        super(body, id);
        this.name = body.name;
        this.documentNumber = body.documentNumber;
        this.contactPhone = body.contactPhone;
        this.contactEmail = body.contactEmail;
        this.status = body.status || CompanyStatus.ACTIVE;
        this.plan = body.plan || CompanyPlan.FREE;
        this.countRegisters = body.countRegisters || 0;
        this.countAlerts = body.countAlerts || env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN;
        this.limitRegisters = body.limitRegisters || env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN;
    }
}
exports.CompanyEntity = CompanyEntity;
