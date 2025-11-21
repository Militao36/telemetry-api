import { Knex } from 'knex';
import { ProjectEntity } from '../entities/project.entity';

export class ProjectsRepository {
  databaseKnex: Knex;

  constructor({ databaseKnex }) {
    this.databaseKnex = databaseKnex;
  }

  async create(data: ProjectEntity) {
    const [project] = await this.databaseKnex<ProjectEntity>('projects').insert(data).returning('*');
    return new ProjectEntity(project, project.id);
  }

  async update(idEmpresa: string, id: string, updateData: Partial<ProjectEntity>) {
    const [project] =  await this.databaseKnex<ProjectEntity>('projects')
      .where({ idEmpresa: idEmpresa, id })
      .update(updateData)
      .returning('*');
      
    return new ProjectEntity(project, project.id);
  }

  async findById(idEmpresa: string, id: string) {
    const project = await this.databaseKnex<ProjectEntity>('projects').where({ idEmpresa: idEmpresa, id }).first();

    if (!project) {
      return null;
    }

    return new ProjectEntity(project, project.id);
  }

  async list(idEmpresa: string) {
    const projects = await this.databaseKnex<ProjectEntity>('projects').where({ idEmpresa: idEmpresa });

    return projects.map((project) => new ProjectEntity(project, project.id));
  }

  async delete(idEmpresa: string, id: string) {
    await this.databaseKnex<ProjectEntity>('projects').where({ idEmpresa: idEmpresa, id }).del();
  }
}
