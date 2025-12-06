import { Cacheable } from '../decorators/Cacheable';
import { DashRepository } from '../repositories/dash.repository';

export class DashService {
  dashRepository: DashRepository;

  constructor({ dashRepository }) {
    this.dashRepository = dashRepository;
  }

  // @Cacheable({ ttl: 60 * 5 }) // Cache for 5 minutes
  public async reportRequests(idEmpresa: string, idProject: string, hour: number) {
    const { totalRequests, totalErrors, avgMs: avgResponse, p50Ms, p90Ms, p95Ms, p99Ms } = await this.dashRepository.getMetrics(idEmpresa, idProject, hour);

    const topRequests = await this.dashRepository.getTopRequests(idEmpresa, idProject, hour);
    const totalQueries = await this.dashRepository.getTotalQueries(idEmpresa, idProject, hour);
    const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, idProject, hour, 'ALL');
    const slowestRequests = await this.dashRepository.getSlowestRequests(idEmpresa, idProject, hour);

    return {
      totalRequests,
      totalErrors,
      avgResponse,
      p50Ms,
      p90Ms,
      p95Ms,
      p99Ms,
      topRequests,
      requestPerTimeSeries,
      slowestRequests,
      totalQueries,
    };
  }
}
