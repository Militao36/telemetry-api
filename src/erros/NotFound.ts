import { BaseError } from './BaseError';

export class NotFound extends BaseError {
  statusCode: number;
  erros: string[];
  constructor(message: string, erros?: string[], statusCode: number = 404) {
    super(message, erros);
    this.statusCode = statusCode;
  }
}
