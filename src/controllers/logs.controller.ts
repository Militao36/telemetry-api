import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';
import { LogService } from '../services/log.service';

@route('/logs')
export class LogsController {
  logService: LogService;

  constructor({ logService }) {
    this.logService = logService;
  }

  @route('/')
  @POST()
  async create(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const { resourceLogs } = request.body;

    await this.logService.create(idEmpresa, request.idProject, resourceLogs, request.projectRedactionFields);

    return response.status(200).json({});
  }

  @GET()
  @route('/')
  async list(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const logs = await this.logService.list(idEmpresa, request.idProject, request.query);

    return response.status(200).json(logs);
  }
}
