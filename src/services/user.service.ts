import { RedisClientType } from 'redis';
import { randomUUID } from 'crypto';

import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { HashService } from './hash.service';
import { NotFound } from '../erros/NotFound';
import { generateToken } from '../middlewares/auth';

export class UserService {
  userRepository: UserRepository;
  hashService: HashService;
  clientRedis: RedisClientType;

  constructor({ userRepository, clientRedis, hashService }) {
    this.userRepository = userRepository;
    this.hashService = hashService;
    this.clientRedis = clientRedis;
  }

  async create(data: UserEntity) {
    const user = new UserEntity({
      ...data,
      idEmpresa: randomUUID(),
    });

    user.password = await this.hashPassword(data.password);

    const userCreated = await this.userRepository.create(user);

    return {
      user: userCreated,
      token: generateToken({
        idEmpresa: userCreated.idEmpresa,
        idUser: userCreated.id,
      }),
    };
  }

  async findByEmail(idEmpresa: string, email: string) {
    const user = await this.userRepository.findByEmail(idEmpresa, email);

    if (!user) {
      throw new NotFound('User not found');
    }

    user.password = '*******';

    return user;
  }

  async findByIdWithoutIdEmpresa(id: string) {
    const cacheKey = `user_id:${id}`;
    const cachedUser = await this.clientRedis.get(cacheKey);

    if (cachedUser) {
      return JSON.parse(cachedUser as string) as UserEntity;
    }

    const user = await this.userRepository.findByIdWithoutIdEmpresa(id);

    if (user) {
      user.password = '*******';
      await this.clientRedis.set(cacheKey, JSON.stringify(user), {
        EX: 3600,
      });

      return user;
    }

    if (!user) {
      throw new NotFound('User not found');
    }
  }

  async findById(idEmpresa: string, id: string) {
    const user = await this.userRepository.findById(idEmpresa, id);

    if (!user) {
      throw new NotFound('User not found');
    }

    user.password = '*******';

    return user;
  }

  async updatePassword(idEmpresa: string, id: string, newPassword: string) {
    return this.userRepository.updatePassword(idEmpresa, id, newPassword);
  }

  async delete(idEmpresa: string, id: string) {
    return this.userRepository.delete(idEmpresa, id);
  }

  private async hashPassword(password: string): Promise<string> {
    const { hash } = await this.hashService.crypto(password);

    return hash;
  }
}
