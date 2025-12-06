import { Entity } from './base/Entity'

export class UserEntity extends Entity {
  idEmpresa: string
  id: string;
  name: string;
  email: string;
  password: string;
  active: boolean;

  constructor(body: Omit<UserEntity, 'id'>, id?: string) {
    super(body, id)
    this.idEmpresa = body.idEmpresa
    this.name = body.name
    this.email = body.email
    this.password = body.password
    this.active = body.active
  }
}
