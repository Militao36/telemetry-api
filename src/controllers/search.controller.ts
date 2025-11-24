import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

@route('/search')
export class RequestsController {
  searchService: SearchService;

  constructor({ searchService }) {
    this.searchService = searchService;
  }

  @route('/')
  @GET()
  async list(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;

    const data = await this.searchService.list(idEmpresa, request.query as any);

    return response.status(200).json(data);
  }
}
