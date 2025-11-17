import { GET, route } from "awilix-express"
import { Request, Response } from "express";
import { QueriesService } from "../services/queries.service";

@route('/queries')
export class DashController {
  queriesService: QueriesService

  constructor({ queriesService }) {
    this.queriesService = queriesService;
  }

  @GET()
  async reportQueries(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9'

    const data = await this.queriesService.reportQueries(idEmpresa, +'12', 'all')

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
