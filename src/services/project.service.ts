import { RedisClientType } from 'redis';
import { ProjectEntity } from '../entities/project.entity';
import { NotFound } from '../erros/NotFound';
import { ProjectsRepository } from '../repositories/projects.repository';

export class ProjectService {
  projectsRepository: ProjectsRepository;
  clientRedis: RedisClientType;

  constructor({ projectsRepository, clientRedis }) {
    this.projectsRepository = projectsRepository;
    this.clientRedis = clientRedis;
  }

  async create(data: ProjectEntity) {
    const project = new ProjectEntity(data);

    project.token = this.generateToken(project.idEmpresa);

    return this.projectsRepository.create(project);
  }

  async update(idEmpresa: string, id: string, updateData: Partial<ProjectEntity>) {
    await this.findById(idEmpresa, id);
    await this.projectsRepository.update(idEmpresa, id, updateData);
  }

  async findById(idEmpresa: string, id: string) {
    const project = await this.projectsRepository.findById(idEmpresa, id);

    if (!project) {
      throw new NotFound('Project not found');
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

  async findByToken(token: string) {
    const key = `project_token:${token}`;
    const cachedProject = await this.clientRedis.get(key);

    if (cachedProject) {
      return JSON.parse(cachedProject as string) as ProjectEntity;
    }

    const project = await this.projectsRepository.findByToken(token);

    if (!project) {
      throw new NotFound('Project not found');
    }

    await this.clientRedis.set(key, JSON.stringify(project), {
      EX: 3600,
    });

    return project;
  }

  private generateToken(idEmpresa: string): string {
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
