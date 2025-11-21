import { POST, route } from 'awilix-express';
import { Request, Response } from 'express';
import { TracesService } from '../services/trace.service';

@route('/logs')
export class TraceController {
  traceService: TracesService;

  constructor({ traceService }) {
    this.traceService = traceService;
  }

  @route('/')
  @POST()
  async create(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const { resourceSpans } = request.body;

    await this.traceService.create(idEmpresa, request.idProject, resourceSpans);

    return response.status(200).json({});
  }
}
