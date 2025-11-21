import { BaseError } from './BaseError'

export class BadRequest extends BaseError {
  statusCode: number
  erros: string[]
  constructor (message: string, erros?: string[], statusCode: number = 400) {
    super(message, erros)
    this.statusCode = statusCode
  }
}
