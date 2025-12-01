import { DELETE, GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

@route('/users')
export class UserController {
  userService: UserService;
  constructor({ userService }) {
    this.userService = userService;
  }

  @route('/me')
  @GET()
  async getMe(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const idUser = request.idUser;

    const user = await this.userService.findById(idEmpresa, idUser);

    return response.status(200).json(user);
  }

  @route('/auth')
  @POST()
  async authenticate(request: Request, response: Response) {
    const { email, password } = request.body;

    const authResult = await this.userService.authenticate(email, password);

    return response.status(200).json(authResult);
  }

  @route('/:id')
  @GET()
  async findById(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { id } = request.params;

    const user = await this.userService.findById(idEmpresa, id);

    return response.status(200).json(user);
  }

  @POST()
  async create(request: Request, response: Response) {
    const data = request.body;

    const user = await this.userService.create(data);

    return response.status(201).json(user);
  }

  @route('/:id/password')
  @POST()
  async updatePassword(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { id } = request.params;
    const { newPassword } = request.body;

    await this.userService.updatePassword(idEmpresa, id, newPassword);

    return response.status(204).send();
  }

  @route('/:id')
  @DELETE()
  async delete(request: Request, response: Response) {
    const idEmpresa = request.idEmpresa;
    const { id } = request.params;

    await this.userService.delete(idEmpresa, id);

    return response.status(204).send();
  }
}
