import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { RequestsService } from '../services/requests.service';

@route('/requests')
export class RequestsController {
  requestsService: RequestsService;

  constructor({ requestsService }) {
    this.requestsService = requestsService;
  }

  @route('/recent')
  @GET()
  async recentRequests(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const { httpMethod, hour } = request.query as { httpMethod?: string; hour: string };

    const data = await this.requestsService.recentRequests(idEmpresa, +hour, httpMethod?.toUpperCase());

    return response.status(200).json(data);
  }

  @route('/slowest')
  @GET()
  async getSlowestRequests(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const { httpMethod, hour } = request.query as { httpMethod?: string; hour: string };

    const data = await this.requestsService.getSlowestRequests(idEmpresa, +hour, httpMethod?.toUpperCase());

    return response.status(200).json(data);
  }

  @route('/metrics')
  @GET()
  async getMetrics(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';

    const { httpMethod, hour } = request.query as { httpMethod?: string; hour: string };

    const data = await this.requestsService.getMetrics(idEmpresa, +hour, httpMethod?.toUpperCase());

    return response.status(200).json(data);
  }

  @route('/traces/:traceId')
  @GET()
  async getTraces(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const { traceId } = request.params;

    const data = await this.requestsService.getTraces(idEmpresa, traceId);

    return response.status(200).json(data);
  }
}
