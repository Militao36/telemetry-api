import { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';

import { SECRET_JWT } from '../env';
import { container } from '../container';
import { UserService } from '../services/user.service';
import { ProjectService } from '../services/project.service';

export async function auth(req: Request, res: Response, next: NextFunction): Promise<any> {
  const excludes = ['/api/v1/users', '/api/v1/users/auth', '/api/v1/users/reset-password'];
  const normalizedPath = req.path.replace(/\/+$/, '') || '/';
  const isExcludedRoute = excludes.some((route) => normalizedPath === route || normalizedPath === `${route}/`);

  if (isExcludedRoute) {
    next();
    return;
  }

  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(401).json({ message: 'Access denied' });
  }

  if (authHeaders) {
    const token = authHeaders.split(' ')[1];

    const isTelemetryIngestRoute = ['POST /api/v1/traces', 'POST /api/v1/logs'].includes(`${req.method.toUpperCase()} ${normalizedPath}`);

    if (isTelemetryIngestRoute) {
      try {
        const project = await container.resolve<ProjectService>('projectService').findByToken(token);
        const users = await container.resolve<UserService>('userService').findAll(project.idEmpresa);

        if (project.token === null || project.token !== token) {
          return res.status(401).json({ message: 'Access denied' });
        }

        if (project.active === false) {
          return res.status(401).json({ message: 'Access denied' });
        }

        if (users.some((u) => u.active === false)) {
          return res.status(401).json({ message: 'Access denied' });
        }

        req.idEmpresa = project.idEmpresa;
        req.idProject = project.id;
        req.projectRedactionFields = project.redactionFields || [];
        req.idUser = null;
        req.user = null;

        next();
        return;
      } catch {
        return res.status(401).json({ message: 'Access denied' });
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Access denied' });
    }

    jwt.verify(token, SECRET_JWT, async (error: any, decoded: any): Promise<any> => {
      if (error) {
        return res.status(401).json({ message: 'Access denied' });
      }

      if (!decoded?.idUser) {
        return res.status(401).json({ message: 'Access denied' });
      }

      if (!decoded?.idProject) {
        return res.status(401).json({ message: 'Access denied' });
      }

      try {
        const user = await container.resolve<UserService>('userService').findByIdWithoutIdEmpresa(decoded.idUser);
        const project = await container.resolve<ProjectService>('projectService').findById(user.idEmpresa, decoded.idProject);

        req.idEmpresa = user?.idEmpresa;
        req.idProject = project.id;
        req.idUser = user?.id;
        req.user = user;

        next();
      } catch {
        return res.status(401).json({ message: 'Access denied' });
      }
    });
  } else {
    return res.status(401).json({ message: 'Access denied' });
  }
}

export function generateToken(args: { idEmpresa: string; idProject: string, idUser: string }): string {
  return jwt.sign(args, SECRET_JWT, {
    expiresIn: 86400 * 30,
  });
}
