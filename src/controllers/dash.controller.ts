import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';
import { DashService } from '../services/dash.service';
import { RedisClientType } from '@redis/client';

@route('/dashboard')
export class DashController {
  dashService: DashService;
  clientRedis: RedisClientType;

  constructor({ dashService, clientRedis }) {
    this.dashService = dashService;
    this.clientRedis = clientRedis;
  }

  @GET()
  async reportRequests(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const { hour = '12' } = request.query as { hour?: string };

    const key = `dash-requests-${idEmpresa}-${hour}`;

    const cache = await this.clientRedis.get(key);

    if (cache) {
      return response.status(200).json(JSON.parse(cache as string));
    }

    const data = await this.dashService.reportRequests(idEmpresa, +hour);

    await this.clientRedis.setEx(key, 60 * 1, JSON.stringify(data));

    return response.status(200).json(data);
  }
}
