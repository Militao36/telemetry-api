import { GET, route } from "awilix-express"
import { Request, Response } from "express";
import { QueriesService } from "../services/queries.service";
import { RedisClientType } from "@redis/client";

@route('/queries')
export class DashController {
  queriesService: QueriesService
  clientRedis: RedisClientType

  constructor({ queriesService, clientRedis }) {
    this.queriesService = queriesService;
    this.clientRedis = clientRedis;
  }

  @GET()
  async reportQueries(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9'
    const { hour, queryTy } = request.query

    const key = `queries-${idEmpresa}-${hour}-${queryTy}`

    const cache = await this.clientRedis.get(key)

    if (cache) {
      return response.status(200).json(JSON.parse(cache as string))
    }

    const data = await this.queriesService.reportQueries(idEmpresa, +(hour || 720), queryTy as 'select' | 'insert' | 'update' | 'delete' | 'all')

    await this.clientRedis.setEx(key, 60 * 5, JSON.stringify(data))

    return response.status(200).json(data)
  }

  @route('/dashboard')
  @GET()
  async dashboardQueries(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9'

    const data = await this.queriesService.dashboardQueries(idEmpresa, +'12')

    return response.status(200).json(data)
  }
}
