import { route, GET, PUT, POST } from 'awilix-express';
import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';

@route('/companies')
export class CompanyController {
  companyService: CompanyService

  constructor({ companyService }) {
    this.companyService = companyService;
  }

  @route('/pay')
  @POST()
  async generatePay(request: Request, response: Response): Promise<Response> {
    const idEmpresa = request.idEmpresa;
    const { plan } = request.body;

    const qrcode = await this.companyService.generatePay(idEmpresa, plan);

    return response.status(200).json({ qrcode });
  }

  @route('/me')
  @GET()
  async findById(request: Request, response: Response): Promise<Response> {
    const idEmpresa = request.idEmpresa;
    const company = await this.companyService.findById(idEmpresa);
    return response.status(200).json(company);
  }

  @route('/:id')
  @PUT()
  async update(request: Request, response: Response): Promise<Response> {
    const idEmpresa = request.idEmpresa;
    await this.companyService.update(idEmpresa, request.body);
    return response.status(204).send();
  }
}
