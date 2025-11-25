import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { RequestsService } from '../services/requests.service';
import { RedisClientType } from '@redis/client';

@route('/requests')
export class RequestsController {
  requestsService: RequestsService;
  clientRedis: RedisClientType;

  constructor({ requestsService, clientRedis }) {
    this.requestsService = requestsService;
    this.clientRedis = clientRedis;
  }

  @route('/recent')
  @GET()
  async recentRequests(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { httpMethod, hour } = request.query as { httpMethod?: string; hour: string };

    const key = `recent-requests-${idEmpresa}-${hour}-${httpMethod}`;

    const cache = await this.clientRedis.get(key);

    if (cache) {
      return response.status(200).json(JSON.parse(cache as string));
    }

    const data = await this.requestsService.recentRequests(idEmpresa, +hour, httpMethod?.toUpperCase());

    await this.clientRedis.setEx(key, 60 * 5, JSON.stringify(data));

    return response.status(200).json(data);
  }

  @route('/slowest')
  @GET()
  async getSlowestRequests(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { httpMethod, hour } = request.query as { httpMethod?: string; hour: string };

    const key = `slowest-requests-${idEmpresa}-${hour}-${httpMethod}`;

    const cache = await this.clientRedis.get(key);

    if (cache) {
      return response.status(200).json(JSON.parse(cache as string));
    }

    const data = await this.requestsService.getSlowestRequests(idEmpresa, +hour, httpMethod?.toUpperCase());

    await this.clientRedis.setEx(key, 60 * 5, JSON.stringify(data));

    return response.status(200).json(data);
  }

  @route('/metrics')
  @GET()
  async getMetrics(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const { httpMethod, hour } = request.query as { httpMethod?: string; hour: string };

    const key = `metrics-requests-${idEmpresa}-${hour}-${httpMethod}`;

    const cache = await this.clientRedis.get(key);

    if (cache) {
      return response.status(200).json(JSON.parse(cache as string));
    }

    const data = await this.requestsService.getMetrics(idEmpresa, +hour, httpMethod?.toUpperCase());

    await this.clientRedis.setEx(key, 60 * 5, JSON.stringify(data));

    return response.status(200).json(data);
  }

  @route('/traces/:traceId')
  @GET()
  async getTraces(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { traceId } = request.params;

    const data = await this.requestsService.getTraces(idEmpresa, traceId);

    return response.status(200).json(data);
  }
}
