import { Entity } from './base/Entity';

export class ProjectEntity extends Entity {
  idEmpresa: string;
  id: string;
  name: string;
  description: string;
  enviroment: string;
  languageOrFramework: string;
  token?: string;
  active: boolean;
  redactionFields?: string[];

  constructor(body: Omit<ProjectEntity, 'id'>, id?: string) {
    super(body, id);
    this.idEmpresa = body.idEmpresa;
    this.name = body.name;
    this.description = body.description;
    this.enviroment = body.enviroment;
    this.languageOrFramework = body.languageOrFramework;
    this.token = body.token;
    this.active = body.active;
    this.redactionFields = Array.isArray(body.redactionFields) ? body.redactionFields : [];
  }
}
