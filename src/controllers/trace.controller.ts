import { POST, route } from "awilix-express"
import { Request, Response } from "express";
import { TracesService } from "../services/trace.service";

@route('/traces')
export class TraceController {
  traceService: TracesService

  constructor({ traceService }) {
    this.traceService = traceService;
  }

  @route('/')
  @POST()
  async create(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9'

    const { resourceSpans } = request.body

    console.log(request.body)

    await this.traceService.create(idEmpresa, resourceSpans)

    return response.status(200).json({})
  }
}
