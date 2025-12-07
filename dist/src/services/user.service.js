"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const crypto_1 = require("crypto");
const user_entity_1 = require("../entities/user.entity");
const NotFound_1 = require("../erros/NotFound");
const auth_1 = require("../middlewares/auth");
const company_entity_1 = require("../entities/company.entity");
const env_1 = require("../env");
const luxon_1 = require("luxon");
class UserService {
    constructor({ userRepository, projectService, clientRedis, hashService, companyService }) {
        this.userRepository = userRepository;
        this.hashService = hashService;
        this.clientRedis = clientRedis;
        this.projectService = projectService;
        this.companyService = companyService;
    }
    async authenticate(email, password) {
        const user = await this.userRepository.findByEmailWithoutIdEmpresa(email);
        if (!user) {
            throw new NotFound_1.NotFound('User not found');
        }
        const isPasswordValid = await this.hashService.compareHash(user.password, password);
        if (!isPasswordValid) {
            throw new NotFound_1.NotFound('Invalid credentials');
        }
        const projects = await this.projectService.list(user.idEmpresa);
        user.password = '*******';
        user.idEmpresa = undefined;
        return {
            user,
            tokens: projects.map((project) => (0, auth_1.generateToken)({
                idProject: project.id,
                idEmpresa: user.idEmpresa,
                idUser: user.id,
            })),
        };
    }
    async register(data) {
        const user = new user_entity_1.UserEntity(Object.assign(Object.assign({}, data), { idEmpresa: (0, crypto_1.randomUUID)() }));
        user.password = await this.hashPassword(data.password);
        user.active = false;
        const company = await this.companyService.create(new company_entity_1.CompanyEntity({
            name: user.name,
            contactEmail: '',
            contactPhone: '',
            documentNumber: '',
            plan: company_entity_1.CompanyPlan.FREE,
            status: company_entity_1.CompanyStatus.ACTIVE,
            countAlerts: env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN,
            countRegisters: 0,
            limitRegisters: env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN,
            expirationDate: luxon_1.DateTime.now().plus({ months: 1 }).toISODate(),
        }));
        user.idEmpresa = company.id;
        await this.userRepository.create(user);
        return this.authenticate(user.email, data.password);
    }
    async findByEmail(idEmpresa, email) {
        const user = await this.userRepository.findByEmail(idEmpresa, email);
        if (!user) {
            throw new NotFound_1.NotFound('User not found');
        }
        user.password = '*******';
        return user;
    }
    async findAll(idEmpresa) {
        const users = await this.userRepository.findAll(idEmpresa);
        users.forEach((user) => {
            user.password = '*******';
        });
        return users;
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
