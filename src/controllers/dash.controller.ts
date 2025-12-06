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
    try {
      const idEmpresa = request.idEmpresa;

      const { hour = '12' } = request.query as { hour?: string };

      if (isNaN(+hour)) {
        return response.status(400).json({ error: 'Hour must be a number' });
      }

      const data = await this.dashService.reportRequests(idEmpresa, request.idProject, +hour);

      return response.status(200).json(data);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
