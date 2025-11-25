import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';
import { TracesService } from '../services/trace.service';

@route('/traces')
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

    await this.traceService.create(idEmpresa, request.idProject!, resourceSpans);

    return response.status(200).json({});
  }

  @route('/:traceId')
  @GET()
  async getTraces(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { traceId } = request.params;

    const data = await this.traceService.getTraces(idEmpresa, traceId);

    return response.status(200).json(data);
  }
}
