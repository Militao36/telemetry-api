import { Knex } from 'knex';

import { UserEntity } from '../entities/user.entity';

export class UserRepository {
  databaseKnex: Knex;

  constructor({ databaseKnex }) {
    this.databaseKnex = databaseKnex;
  }

  async create(data: UserEntity) {
    const [user] = await this.databaseKnex<UserEntity>('users').insert(data).returning('*');
    return new UserEntity(user, user.id);
  }

  async findAll(idEmpresa: string) {
    const users = await this.databaseKnex<UserEntity>('users').where({ idEmpresa: idEmpresa });

    return users.map((user) => new UserEntity(user, user.id));
  }

  async incrementCountRegisters(idEmpresa: string, count: number = 1) {
    return await this.databaseKnex<UserEntity>('users')
      .where({ idEmpresa: idEmpresa })
      .increment('countRegisters', count)
      .returning('*') as UserEntity[];
  }

  async findByEmail(idEmpresa: string, email: string) {
    const user = await this.databaseKnex<UserEntity>('users').where({ idEmpresa: idEmpresa, email }).first();

    if (!user) {
      return null;
    }

    return new UserEntity(user, user.id);
  }

  async findByEmailWithoutIdEmpresa(email: string) {
    const user = await this.databaseKnex<UserEntity>('users').where({ email }).first();

    if (!user) {
      return null;
    }

    return new UserEntity(user, user.id);
  }

  async findByIdWithoutIdEmpresa(id: string) {
    const user = await this.databaseKnex<UserEntity>('users').where({ id }).first();

    if (!user) {
      return null;
    }

    return new UserEntity(user, user.id);
  }

  async findById(idEmpresa: string, id: string) {
    const user = await this.databaseKnex<UserEntity>('users').where({ idEmpresa: idEmpresa, id }).first();

    if (!user) {
      return null;
    }

    return new UserEntity(user, user.id);
  }

  async updatePassword(idEmpresa: string, id: string, newPassword: string) {
    await this.databaseKnex<UserEntity>('users').where({ idEmpresa: idEmpresa, id }).update({ password: newPassword });
  }

  async delete(idEmpresa: string, id: string) {
    await this.databaseKnex<UserEntity>('users').where({ idEmpresa: idEmpresa, id }).del();
  }
}
