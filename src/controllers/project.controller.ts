import { DELETE, GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';

@route('/projects')
export class ProjectController {
  projectService: ProjectService;
  constructor({ projectService }) {
    this.projectService = projectService;
  }

  @route('/:id')
  @GET()
  async findById(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { id } = request.params;

    const user = await this.projectService.findById(idEmpresa, id);

    return response.status(200).json(user);
  }

  @GET()
  async list(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const projects = await this.projectService.list(idEmpresa);

    return response.status(200).json(projects);
  }

  @POST()
  async create(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const data = request.body;

    data.idEmpresa = idEmpresa;

    const user = await this.projectService.create(data);

    return response.status(201).json(user);
  }

  @route('/:id')
  @DELETE()
  async delete(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { id } = request.params;

    await this.projectService.delete(idEmpresa, id);

    return response.status(204).send();
  }
}
