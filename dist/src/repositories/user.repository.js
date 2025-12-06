"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const user_entity_1 = require("../entities/user.entity");
class UserRepository {
    constructor({ databaseKnex }) {
        this.databaseKnex = databaseKnex;
    }
    async create(data) {
        const [user] = await this.databaseKnex('users').insert(data).returning('*');
        return new user_entity_1.UserEntity(user, user.id);
    }
    async findAll(idEmpresa) {
        const users = await this.databaseKnex('users').where({ idEmpresa: idEmpresa });
        return users.map((user) => new user_entity_1.UserEntity(user, user.id));
    }
    async incrementCountRegisters(idEmpresa, count = 1) {
        return await this.databaseKnex('users')
            .where({ idEmpresa: idEmpresa })
            .increment('countRegisters', count)
            .returning('*');
    }
    async findByEmail(idEmpresa, email) {
        const user = await this.databaseKnex('users').where({ idEmpresa: idEmpresa, email }).first();
        if (!user) {
            return null;
        }
        return new user_entity_1.UserEntity(user, user.id);
    }
    async findByEmailWithoutIdEmpresa(email) {
        const user = await this.databaseKnex('users').where({ email }).first();
        if (!user) {
            return null;
        }
        return new user_entity_1.UserEntity(user, user.id);
    }
    async findByIdWithoutIdEmpresa(id) {
        const user = await this.databaseKnex('users').where({ id }).first();
        if (!user) {
            return null;
        }
        return new user_entity_1.UserEntity(user, user.id);
    }
    async findById(idEmpresa, id) {
        const user = await this.databaseKnex('users').where({ idEmpresa: idEmpresa, id }).first();
        if (!user) {
            return null;
        }
        return new user_entity_1.UserEntity(user, user.id);
    }
    async updatePassword(idEmpresa, id, newPassword) {
        await this.databaseKnex('users').where({ idEmpresa: idEmpresa, id }).update({ password: newPassword });
    }
    async delete(idEmpresa, id) {
        await this.databaseKnex('users').where({ idEmpresa: idEmpresa, id }).del();
    }
}
exports.UserRepository = UserRepository;
