import { route, GET, POST, PUT, DELETE } from 'awilix-express';
import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { CompanyEntity } from '../entities/company.entity';

@route('/companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) { }

  @route('/:id')
  @GET()
  async findById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const company = await this.companyService.findById(id);
    return response.status(200).json(company);
  }

  @GET()
  async list(request: Request, response: Response): Promise<Response> {
    const companies = await this.companyService.list();
    return response.status(200).json(companies);
  }

  @POST()
  async create(request: Request, response: Response): Promise<Response> {
    const company = await this.companyService.create(request.body as CompanyEntity);
    return response.status(201).json(company);
  }

  @route('/:id')
  @PUT()
  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    await this.companyService.update(id, request.body);
    return response.status(204).send();
  }

  @route('/:id')
  @DELETE()
  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    await this.companyService.delete(id);
    return response.status(204).send();
  }
}
