import { UserEntity } from '../../entities/user.entity';

export {};

declare global {
  namespace Express {
    export interface Request {
      idEmpresa?: string;
      idUser?: string;
      user: UserEntity;
    }
  }
}
