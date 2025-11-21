"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const project_entity_1 = require("../entities/project.entity");
const NotFound_1 = require("../erros/NotFound");
class ProjectService {
    constructor({ projectsRepository, clientRedis }) {
        this.projectsRepository = projectsRepository;
        this.clientRedis = clientRedis;
    }
    async create(data) {
        const project = new project_entity_1.ProjectEntity(data);
        project.token = this.generateToken(project.idEmpresa);
        return this.projectsRepository.create(project);
    }
    async update(idEmpresa, id, updateData) {
        await this.findById(idEmpresa, id);
        await this.projectsRepository.update(idEmpresa, id, updateData);
    }
    async findById(idEmpresa, id) {
        const project = await this.projectsRepository.findById(idEmpresa, id);
        if (!project) {
            throw new NotFound_1.NotFound('Project not found');
        }
        return project;
    }
    async list(idEmpresa) {
        return this.projectsRepository.list(idEmpresa);
    }
    async delete(idEmpresa, id) {
        await this.findById(idEmpresa, id);
        await this.projectsRepository.delete(idEmpresa, id);
    }
    async findByToken(token) {
        const key = `project_token:${token}`;
        const cachedProject = await this.clientRedis.get(key);
        if (cachedProject) {
            return JSON.parse(cachedProject);
        }
        const project = await this.projectsRepository.findByToken(token);
        if (!project) {
            throw new NotFound_1.NotFound('Project not found');
        }
        await this.clientRedis.set(key, JSON.stringify(project), {
            EX: 3600,
        });
        return project;
    }
    generateToken(idEmpresa) {
        const random1 = Math.random().toString(36).substring(2, 15);
        const random2 = Math.random().toString(36).substring(2, 15);
        const empresaChars = idEmpresa.split('');
        const combined = (random1 + random2).split('');
        empresaChars.forEach((char) => {
            const pos = Math.floor(Math.random() * combined.length);
            combined.splice(pos, 0, char);
        });
        return `proj_${combined.join('')}`;
    }
}
exports.ProjectService = ProjectService;
