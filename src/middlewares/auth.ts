import { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';

import { SECRET_JWT } from '../env';
import { container } from '../container';
import { UserService } from '../services/user.service';
import { ProjectService } from '../services/project.service';

export async function auth(req: Request, res: Response, next: NextFunction): Promise<any> {
  const excludes = ['/api/v1/users'];

  if (excludes.includes(req.url)) {
    next();
    return;
  }

  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(401).json({ message: 'Access denied' });
  }

  if (authHeaders) {
    const token = authHeaders.split(' ')[1];

    if (req.url === '/api/v1/traces' && req.method.toLowerCase() === 'post') {
      const project = await container.resolve<ProjectService>('projectService').findByToken(token);

      if (project.token === null || project.token !== token) {
        return res.status(401).json({ message: 'Access denied' });
      }

      req.idEmpresa = project.idEmpresa;
      req.idProject = project.id;
      req.idUser = null;
      req.user = null;

      next();
      return;
    }

    jwt.verify(token, SECRET_JWT, async (error: any, decoded: any): Promise<any> => {
      if (error) {
        return res.status(401).json({ message: 'Access denied' });
      }

      const user = await container.resolve<UserService>('userService').findByIdWithoutIdEmpresa(decoded.idUser);

      req.idEmpresa = user?.idEmpresa;
      req.idUser = user?.id;
      req.user = user;

      next();
    });
  } else {
    return res.status(401).json({ message: 'Access denied' });
  }
}

export function generateToken(args: { idEmpresa: string; idUser: string }): string {
  return jwt.sign(args, SECRET_JWT, {
    expiresIn: 86400 * 30,
  });
}
