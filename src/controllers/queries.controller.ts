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

    const data = await this.queriesService.reportQueries(
      idEmpresa,
      request.idProject,
      +(hour || 720),
      queryTy as 'select' | 'insert' | 'update' | 'del' | 'all',
    );

    return response.status(200).json(data);
  }

  @route('/dashboard')
  @GET()
  async dashboardQueries(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const data = await this.queriesService.dashboardQueries(idEmpresa, request.idProject, +'12');

    return response.status(200).json(data);
  }

  @route('/traces/:traceId')
  @GET()
  async getTraces(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { traceId } = request.params;

    const data = await this.queriesService.getTraces(idEmpresa, request.idProject, traceId);

    return response.status(200).json(data);
  }
}
