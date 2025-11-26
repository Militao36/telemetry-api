import { Cacheable } from '../decorators/Cacheable';
import { DashRepository } from '../repositories/dash.repository';

export class DashService {
  dashRepository: DashRepository;

  constructor({ dashRepository }) {
    this.dashRepository = dashRepository;
  }

  @Cacheable({ ttl: 60 })
  public async reportRequests(idEmpresa: string, hour: number) {
    const { totalRequests, totalErrors, avgMs: avgResponse, p50Ms, p90Ms, p95Ms, p99Ms } = await this.dashRepository.getMetrics(idEmpresa, hour);

    const topRequests = await this.dashRepository.getTopRequests(idEmpresa, hour);
    const totalQueries = await this.dashRepository.getTotalQueries(idEmpresa, hour);
    const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, hour, 'ALL');
    const slowestRequests = await this.dashRepository.getSlowestRequests(idEmpresa, hour);

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
