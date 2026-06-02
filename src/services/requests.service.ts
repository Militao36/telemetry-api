import { Cacheable } from '../decorators/Cacheable';
import { DashRepository } from '../repositories/dash.repository';
import { RequestsRepository } from '../repositories/requests.repository';
import { clampInt, truncateString } from '../utils/queryParams';

export class RequestsService {
  requestsRepository: RequestsRepository;
  dashRepository: DashRepository;

  constructor({ requestsRepository, dashRepository }) {
    this.requestsRepository = requestsRepository;
    this.dashRepository = dashRepository;
  }

  @Cacheable({
    ttl: 60,
    prefix: 'cache:requests:recentRequests',
    keyBuilder: (idEmpresa: string, idProject: string, hour: number, httpMethod: string) => {
      const safeHour = clampInt(hour, 1, 1, 720);
      const method = truncateString(httpMethod, 16)?.toUpperCase() || 'ALL';
      const safeHttpMethod = /^[A-Z]+$/.test(method) ? method : 'ALL';

      return JSON.stringify({ idEmpresa, idProject, hour: safeHour, httpMethod: safeHttpMethod });
    },
  })
  public async recentRequests(idEmpresa: string, idProject: string, hour: number, httpMethod: string) {
    const requests = await this.requestsRepository.recentRequests(idEmpresa, idProject, clampInt(hour, 1, 1, 720), this.safeHttpMethod(httpMethod));

    return requests;
  }

  @Cacheable({
    ttl: 60,
    prefix: 'cache:requests:getSlowestRequests',
    keyBuilder: (idEmpresa: string, idProject: string, hour: number, httpMethod: string) => {
      const safeHour = clampInt(hour, 1, 1, 720);
      const method = truncateString(httpMethod, 16)?.toUpperCase() || 'ALL';
      const safeHttpMethod = /^[A-Z]+$/.test(method) ? method : 'ALL';

      return JSON.stringify({ idEmpresa, idProject, hour: safeHour, httpMethod: safeHttpMethod });
    },
  })
  public async getSlowestRequests(idEmpresa: string, idProject: string, hour: number, httpMethod: string) {
    const requests = await this.requestsRepository.getSlowestRequests(
      idEmpresa,
      idProject,
      clampInt(hour, 1, 1, 720),
      this.safeHttpMethod(httpMethod),
    );

    return requests;
  }

  @Cacheable({
    ttl: 60,
    prefix: 'cache:requests:getMetrics',
    keyBuilder: (idEmpresa: string, idProject: string, hour: number = 1, httpMethod: string = 'ALL') => {
      const safeHour = clampInt(hour, 1, 1, 720);
      const method = truncateString(httpMethod, 16)?.toUpperCase() || 'ALL';
      const safeHttpMethod = /^[A-Z]+$/.test(method) ? method : 'ALL';

      return JSON.stringify({ idEmpresa, idProject, hour: safeHour, httpMethod: safeHttpMethod });
    },
  })
  public async getMetrics(idEmpresa: string, idProject: string, hour: number = 1, httpMethod: string = 'ALL') {
    const safeHour = clampInt(hour, 1, 1, 720);
    const safeHttpMethod = this.safeHttpMethod(httpMethod);

    const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, idProject, safeHour, safeHttpMethod);

    const responseStatusDistribution = await this.requestsRepository.getResponseStatusDistribution(idEmpresa, safeHour, safeHttpMethod, idProject);

    return {
      requestPerTimeSeries,
      responseStatusDistribution,
    };
  }

  @Cacheable({
    ttl: 60,
    prefix: 'cache:requests:getTraces',
    keyBuilder: (idEmpresa: string, idProject: string, traceId: string) => {
      return JSON.stringify({ idEmpresa, idProject, traceId: String(traceId || '') });
    },
  })
  public async getTraces(idEmpresa: string, idProject: string, traceId: string) {
    const traces = await this.requestsRepository.getTraces(idEmpresa, idProject, traceId);

    return traces;
  }

  private safeHttpMethod(httpMethod?: string): string {
    const method = truncateString(httpMethod, 16)?.toUpperCase() || 'ALL';

    return /^[A-Z]+$/.test(method) ? method : 'ALL';
  }
}
