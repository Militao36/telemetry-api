import { GET, route } from "awilix-express"
import { Request, Response } from "express";
import { DashService } from "../services/dash.service";

@route('/dashboard')
export class DashController {
  dashService: DashService

  constructor({ dashService }) {
    this.dashService = dashService;
  }

  @GET()
  async reportRequests(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9'

    const data = await this.dashService.reportRequests(idEmpresa, +'12')

    return response.status(200).json(data)
  }
}
