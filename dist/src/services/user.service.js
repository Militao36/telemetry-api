"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_entity_1 = require("../entities/user.entity");
const NotFound_1 = require("../erros/NotFound");
const auth_1 = require("../middlewares/auth");
class UserService {
    constructor({ userRepository, clientRedis, hashService }) {
        this.userRepository = userRepository;
        this.hashService = hashService;
        this.clientRedis = clientRedis;
    }
    async create(data) {
        const user = new user_entity_1.UserEntity(data);
        user.password = await this.hashPassword(data.password);
        const userCreated = await this.userRepository.create(user);
        return {
            user: userCreated,
            token: (0, auth_1.generateToken)({
                idEmpresa: userCreated.idEmpresa,
                idUser: userCreated.id,
            }),
        };
    }
    async findByEmail(idEmpresa, email) {
        const user = await this.userRepository.findByEmail(idEmpresa, email);
        if (!user) {
            throw new NotFound_1.NotFound('User not found');
        }
        user.password = '*******';
        return user;
    }
    async findByIdWithoutIdEmpresa(id) {
        const cacheKey = `user_id:${id}`;
        const cachedUser = await this.clientRedis.get(cacheKey);
        if (cachedUser) {
            return JSON.parse(cachedUser);
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
            throw new NotFound_1.NotFound('User not found');
        }
    }
    async findById(idEmpresa, id) {
        const user = await this.userRepository.findById(idEmpresa, id);
        if (!user) {
            throw new NotFound_1.NotFound('User not found');
        }
        user.password = '*******';
        return user;
    }
    async updatePassword(idEmpresa, id, newPassword) {
        return this.userRepository.updatePassword(idEmpresa, id, newPassword);
    }
    async delete(idEmpresa, id) {
        return this.userRepository.delete(idEmpresa, id);
    }
    async hashPassword(password) {
        const { hash } = await this.hashService.crypto(password);
        return hash;
    }
}
exports.UserService = UserService;
