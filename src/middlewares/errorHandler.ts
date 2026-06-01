import { type NextFunction, type Request, type Response } from 'express';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.log(err);
  if (err?.message?.includes('Cannot delete or update a parent row')) {
    res.status(400).json({
      message: 'Esse registro não pode ser deletado, favor deletar os items dele antes.',
    });
  }

  if (err?.message?.includes('connect ECONNREFUSED 127.0.0.1:3306') || err?.sqlMessage) {
    res.status(500).json({
      message: 'Server error',
    });
  }

  res.status(err.statusCode || 500).json({
    message: err?.message ?? '',
    erros: err?.erros || {},
  });
}

export { errorHandler };
