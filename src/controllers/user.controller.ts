import { DELETE, GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';
import { QueriesService } from '../services/queries.service';
import { RedisClientType } from '@redis/client';
import { UserService } from '../services/user.service';

@route('/users')
export class UserController {
  userService: UserService;
  constructor({ userService }) {
    this.userService = userService;
  }

  @route('/:id')
  @GET()
  async findById(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const { id } = request.params;

    const user = await this.userService.findById(idEmpresa, id);

    return response.status(200).json(user);
  }

  @POST()
  async create(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const data = request.body;

    data.idEmpresa = idEmpresa;

    const user = await this.userService.create(data);

    return response.status(201).json(user);
  }

  @route('/:id/password')
  @POST()
  async updatePassword(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const { id } = request.params;
    const { newPassword } = request.body;

    await this.userService.updatePassword(idEmpresa, id, newPassword);

    return response.status(204).send();
  }

  @route('/:id')
  @DELETE()
  async delete(request: Request, response: Response) {
    const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
    const { id } = request.params;

    await this.userService.delete(idEmpresa, id);

    return response.status(204).send();
  }
}
