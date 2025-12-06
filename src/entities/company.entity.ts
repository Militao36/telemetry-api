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

  constructor(body: Omit<CompanyEntity, 'id'>, id?: string) {
    super(body, id)
    this.idEmpresa = body.idEmpresa
    this.name = body.name
    this.documentNumber = body.documentNumber
    this.contactPhone = body.contactPhone
    this.contactEmail = body.contactEmail
    this.status = body.status || CompanyStatus.ACTIVE
    this.plan = body.plan || CompanyPlan.BASIC
  }
}
