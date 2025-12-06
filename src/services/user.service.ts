import { RedisClientType } from 'redis';
import { randomUUID } from 'crypto';

import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { HashService } from './hash.service';
import { NotFound } from '../erros/NotFound';
import { generateToken } from '../middlewares/auth';
import { ProjectService } from './project.service';
import { CompanyService } from './company.service';
import { CompanyEntity, CompanyPlan, CompanyStatus } from '../entities/company.entity';

export class UserService {
  userRepository: UserRepository;
  hashService: HashService;
  projectService: ProjectService;
  clientRedis: RedisClientType;
  companyService: CompanyService;

  constructor({ userRepository, projectService, clientRedis, hashService, companyService }) {
    this.userRepository = userRepository;
    this.hashService = hashService;
    this.clientRedis = clientRedis;
    this.projectService = projectService;
    this.companyService = companyService;
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findByEmailWithoutIdEmpresa(email);

    if (!user) {
      throw new NotFound('User not found');
    }

    const isPasswordValid = await this.hashService.compareHash(user.password, password);

    if (!isPasswordValid) {
      throw new NotFound('Invalid credentials');
    }

    const projects = await this.projectService.list(user.idEmpresa);

    user.password = '*******';
    user.idEmpresa = undefined;

    return {
      user,
      tokens: projects.map((project) => generateToken({
        idProject: project.id,
        idEmpresa: user.idEmpresa,
        idUser: user.id,
      })),
    };
  }

  async create(data: UserEntity) {
    const user = new UserEntity({
      ...data,
      idEmpresa: randomUUID(),
    });

    user.password = await this.hashPassword(data.password);
    user.active = false;

    await this.userRepository.create(user);

    const usersExistsByIdEmpresa = await this.userRepository.findAll(user.idEmpresa);

    if (usersExistsByIdEmpresa.length === 1) {
      await this.companyService.create(new CompanyEntity({
        idEmpresa: user.idEmpresa,
        name: user.name,
        contactEmail: '',
        contactPhone: '',
        documentNumber: '',
        plan: CompanyPlan.FREE,
        status: CompanyStatus.INACTIVE,
      }));
    }

    return this.authenticate(user.email, data.password);
  }

  async findByEmail(idEmpresa: string, email: string) {
    const user = await this.userRepository.findByEmail(idEmpresa, email);

    if (!user) {
      throw new NotFound('User not found');
    }

    user.password = '*******';

    return user;
  }

  async findAll(idEmpresa: string) {
    const users = await this.userRepository.findAll(idEmpresa);

    users.forEach((user) => {
      user.password = '*******';
    });

    return users;
  }

  async incrementCountRegisters(idEmpresa: string, count: number = 1) {
    return await this.userRepository.incrementCountRegisters(idEmpresa, count);
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
