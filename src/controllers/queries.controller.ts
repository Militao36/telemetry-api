import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';
import { QueriesService } from '../services/queries.service';
import { RedisClientType } from '@redis/client';

@route('/queries')
export class DashController {
  queriesService: QueriesService;
  clientRedis: RedisClientType;

  constructor({ queriesService, clientRedis }) {
    this.queriesService = queriesService;
    this.clientRedis = clientRedis;
  }

  @GET()
  async reportQueries(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { hour, queryTy } = request.query;

    // const key = `queries-${idEmpresa}-${hour}-${queryTy}`;

    // const cache = await this.clientRedis.get(key);

    // if (cache) {
    //   return response.status(200).json(JSON.parse(cache as string));
    // }

    const data = await this.queriesService.reportQueries(idEmpresa, +(hour || 720), queryTy as 'select' | 'insert' | 'update' | 'del' | 'all');

    // await this.clientRedis.setEx(key, 60 * 5, JSON.stringify(data));

    return response.status(200).json(data);
  }

  @route('/dashboard')
  @GET()
  async dashboardQueries(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    // const key = `dashboard-queries-${idEmpresa}`;

    // const cache = await this.clientRedis.get(key);

    // if (cache) {
    //   return response.status(200).json(JSON.parse(cache as string));
    // }

    const data = await this.queriesService.dashboardQueries(idEmpresa, +'12');

    // await this.clientRedis.setEx(key, 60 * 5, JSON.stringify(data));

    return response.status(200).json(data);
  }

  @route('/traces/:traceId')
  @GET()
  async getTraces(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { traceId } = request.params;

    const data = await this.queriesService.getTraces(idEmpresa, traceId);

    return response.status(200).json(data);
  }
}
