import { Queue } from "bull";
import { NormalizedSpan } from "../queues/bull/utils/normalizeOtlpHttpJsonTrace";

export class TracesService {
  queueTraces: Queue
  normalizeOTLP: (resourceSpans: any[]) => Array<NormalizedSpan>

  constructor({ queueTraces, normalizeOTLP }) {
    this.queueTraces = queueTraces
    this.normalizeOTLP = normalizeOTLP
  }

  async create(idEmpresa: string, resourceSpans: Array<Record<string, any>>) {
    const spans = this.normalizeOTLP(resourceSpans);

    await this.queueTraces.add({
      idEmpresa,
      spans,
    });
  }
}
