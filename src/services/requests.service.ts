import { QueriesRepository } from "../repositories/queries.repository";
import { RequestsRepository } from "../repositories/requests.repository";

export class RequestsService {
  requestsRepository: RequestsRepository;

  constructor({ requestsRepository }) {
    this.requestsRepository = requestsRepository;
  }

  public async recentRequests(idEmpresa: string, limit: number) {
    const requests = await this.requestsRepository.recentRequests(idEmpresa, limit);

    return requests;
  }

  public async getTraces(idEmpresa: string, traceId: string) {
    const traces = await this.requestsRepository.getTraces(idEmpresa, traceId);

    return traces;
  }
}