export class BaseError extends Error {
  statusCode: number;
  erros: string[];
  constructor(message: string, erros?: string[]) {
    super(message);
    this.message = message || 'Internal server error';
    this.erros = erros ?? [];
    this.statusCode = 500;
  }
}
