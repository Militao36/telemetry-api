import { ProjectEntity } from '../entities/project.entity';
import { ProjectsRepository } from '../repositories/projects.repository';

export class ProjectService {
  projectsRepository: ProjectsRepository;

  constructor({ projectsRepository }) {
    this.projectsRepository = projectsRepository;
  }

  async create(data: ProjectEntity) {
    const project = new ProjectEntity(data);

    return this.projectsRepository.create(project);
  }

  async update(idEmpresa: string, id: string, updateData: any) {
    await this.findById(idEmpresa, id);
    await this.projectsRepository.update(idEmpresa, id, updateData);
  }

  async findById(idEmpresa: string, id: string) {
    const project = this.projectsRepository.findById(idEmpresa, id);

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  async list(idEmpresa: string) {
    return this.projectsRepository.list(idEmpresa);
  }

  async delete(idEmpresa: string, id: string) {
    await this.findById(idEmpresa, id);
    await this.projectsRepository.delete(idEmpresa, id);
  }
}
