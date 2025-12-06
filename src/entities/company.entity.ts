import { DEFAULT_LIMIT_REGISTERS_FREE_PLAN } from '../env'
import { Entity } from './base/Entity'

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum CompanyPlan {
  FREE = 'free',
  BASIC = 'basic',
  COMPLETE = 'complete',
}

export class CompanyEntity extends Entity {
  idEmpresa: string
  id: string
  name: string
  documentNumber: string
  contactPhone: string
  contactEmail: string
  status: CompanyStatus
  plan: CompanyPlan
  countRegisters: number;
  countAlerts: number;
  limitRegisters: number;

  constructor(body: Omit<CompanyEntity, 'id'>, id?: string) {
    super(body, id)
    this.idEmpresa = body.idEmpresa
    this.name = body.name
    this.documentNumber = body.documentNumber
    this.contactPhone = body.contactPhone
    this.contactEmail = body.contactEmail
    this.status = body.status || CompanyStatus.ACTIVE
    this.plan = body.plan || CompanyPlan.FREE
    this.countRegisters = body.countRegisters || 0;
    this.countAlerts = body.countAlerts || DEFAULT_LIMIT_REGISTERS_FREE_PLAN;
    this.limitRegisters = body.limitRegisters || DEFAULT_LIMIT_REGISTERS_FREE_PLAN;
  }
}
