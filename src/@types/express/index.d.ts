import { UserEntity } from '../../entities/user.entity';

export {};

declare global {
  namespace Express {
    export interface Request {
      idEmpresa?: string;
      idProject?: string;
      idUser?: string;
      projectRedactionFields?: string[];
      user: UserEntity;
    }
  }
}
