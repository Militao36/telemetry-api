import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { HashService } from './hash.service';

export class UserService {
  userRepository: UserRepository;
  hashService: HashService;

  constructor({ userRepository, hashService }) {
    this.userRepository = userRepository;
    this.hashService = hashService;
  }

  async create(data: UserEntity) {
    const user = new UserEntity(data);

    user.password = await this.hashPassword(data.password);

    return this.userRepository.create(user);
  }

  async findByEmail(idEmpresa: string, email: string) {
    const user = await this.userRepository.findByEmail(idEmpresa, email);

    user.password = '*******';

    return user;
  }

  async findById(idEmpresa: string, id: string) {
    const user = await this.userRepository.findById(idEmpresa, id);

    user.password = '*******';

    return user;
  }

  async updatePassword(idEmpresa: string, id: string, newPassword: string) {
    return this.userRepository.updatePassword(idEmpresa, id, newPassword);
  }

  async delete(idEmpresa: string, id: string) {
    return this.userRepository.delete(idEmpresa, id);
  }

  private async hashPassword(password: string): Promise<string> {
    const { hash } = await this.hashService.crypto(password);

    return hash;
  }
}
