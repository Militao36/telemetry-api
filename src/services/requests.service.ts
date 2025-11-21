import { DashRepository } from '../repositories/dash.repository';
import { QueriesRepository } from '../repositories/queries.repository';
import { RequestsRepository } from '../repositories/requests.repository';

export class RequestsService {
  requestsRepository: RequestsRepository;
  dashRepository: DashRepository;

  constructor({ requestsRepository, dashRepository }) {
    this.requestsRepository = requestsRepository;
    this.dashRepository = dashRepository;
  }

  public async recentRequests(idEmpresa: string, hour: number, httpMethod: string) {
    const requests = await this.requestsRepository.recentRequests(idEmpresa, hour, httpMethod);

    return requests;
  }

  public async getSlowestRequests(idEmpresa: string, hour: number, httpMethod: string) {
    const requests = await this.requestsRepository.getSlowestRequests(idEmpresa, hour, httpMethod);

    return requests;
  }

  public async getMetrics(idEmpresa: string, hour: number = 1, httpMethod: string = 'ALL') {
    const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(
      idEmpresa,
      hour,
      httpMethod,
    );

    const responseStatusDistribution = await this.requestsRepository.getResponseStatusDistribution(
      idEmpresa,
      hour,
      httpMethod,
    );

    return {
      requestPerTimeSeries,
      responseStatusDistribution,
    };
  }

  public async getTraces(idEmpresa: string, traceId: string) {
    const traces = await this.requestsRepository.getTraces(idEmpresa, traceId);

    return traces;
  }
}
