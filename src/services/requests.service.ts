import { Cacheable } from '../decorators/Cacheable';
import { DashRepository } from '../repositories/dash.repository';
import { RequestsRepository } from '../repositories/requests.repository';

export class RequestsService {
  requestsRepository: RequestsRepository;
  dashRepository: DashRepository;

  constructor({ requestsRepository, dashRepository }) {
    this.requestsRepository = requestsRepository;
    this.dashRepository = dashRepository;
  }

  @Cacheable({ ttl: 60 })
  public async recentRequests(idEmpresa: string, idProject: string, hour: number, httpMethod: string) {
    const requests = await this.requestsRepository.recentRequests(idEmpresa, idProject, hour, httpMethod);

    return requests;
  }

  @Cacheable({ ttl: 60 })
  public async getSlowestRequests(idEmpresa: string, idProject: string, hour: number, httpMethod: string) {
    const requests = await this.requestsRepository.getSlowestRequests(idEmpresa, idProject, hour, httpMethod);

    return requests;
  }

  @Cacheable({ ttl: 60 })
  public async getMetrics(idEmpresa: string, idProject: string, hour: number = 1, httpMethod: string = 'ALL') {
    const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, idProject, hour, httpMethod);

    const responseStatusDistribution = await this.requestsRepository.getResponseStatusDistribution(idEmpresa, hour, httpMethod);

    return {
      requestPerTimeSeries,
      responseStatusDistribution,
    };
  }

  @Cacheable({ ttl: 60 })
  public async getTraces(idEmpresa: string, idProject: string, traceId: string) {
    const traces = await this.requestsRepository.getTraces(idEmpresa, idProject, traceId);

    return traces;
  }
}
