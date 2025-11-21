"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsRepository = void 0;
const project_entity_1 = require("../entities/project.entity");
class ProjectsRepository {
    constructor({ databaseKnex }) {
        this.databaseKnex = databaseKnex;
    }
    async create(data) {
        const [project] = await this.databaseKnex('projects').insert(data).returning('*');
        return new project_entity_1.ProjectEntity(project, project.id);
    }
    async update(idEmpresa, id, updateData) {
        const [project] = await this.databaseKnex('projects').where({ idEmpresa: idEmpresa, id }).update(updateData).returning('*');
        return new project_entity_1.ProjectEntity(project, project.id);
    }
    async findByToken(token) {
        const project = await this.databaseKnex('projects').where({ token }).first();
        if (!project) {
            return null;
        }
        return new project_entity_1.ProjectEntity(project, project.id);
    }
    async findById(idEmpresa, id) {
        const project = await this.databaseKnex('projects').where({ idEmpresa: idEmpresa, id }).first();
        if (!project) {
            return null;
        }
        return new project_entity_1.ProjectEntity(project, project.id);
    }
    async list(idEmpresa) {
        const projects = await this.databaseKnex('projects').where({ idEmpresa: idEmpresa });
        return projects.map((project) => new project_entity_1.ProjectEntity(project, project.id));
    }
    async delete(idEmpresa, id) {
        await this.databaseKnex('projects').where({ idEmpresa: idEmpresa, id }).del();
    }
}
exports.ProjectsRepository = ProjectsRepository;
