import { Cacheable } from '../decorators/Cacheable';
import { DashRepository } from '../repositories/dash.repository';
import { clampInt } from '../utils/queryParams';

export class DashService {
  dashRepository: DashRepository;

  constructor({ dashRepository }) {
    this.dashRepository = dashRepository;
  }

  // @Cacheable({ ttl: 60 * 5 }) // Cache for 5 minutes
  public async reportRequests(idEmpresa: string, idProject: string, hour: number) {
    const safeHour = clampInt(hour, 12, 1, 720);
    const {
      totalRequests,
      totalErrors,
      avgMs: avgResponse,
      p50Ms,
      p90Ms,
      p95Ms,
      p99Ms,
    } = await this.dashRepository.getMetrics(idEmpresa, idProject, safeHour);

    const topRequests = await this.dashRepository.getTopRequests(idEmpresa, idProject, safeHour);
    const totalQueries = await this.dashRepository.getTotalQueries(idEmpresa, idProject, safeHour);
    const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, idProject, safeHour, 'ALL');
    const slowestRequests = await this.dashRepository.getSlowestRequests(idEmpresa, idProject, safeHour);

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
