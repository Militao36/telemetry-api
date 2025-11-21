import { QueriesRepository } from "../repositories/queries.repository";
import { RequestsRepository } from "../repositories/requests.repository";

export class RequestsService {
  requestsRepository: RequestsRepository;

  constructor({ requestsRepository }) {
    this.requestsRepository = requestsRepository;
  }

  public async getTraces(idEmpresa: string, traceId: string) {
    const traces = await this.requestsRepository.getTraces(idEmpresa, traceId);

    return traces;
  }
}