import Bull from "bull";

export interface QueueInterface {
  handle(job: Bull.Job<any>): Promise<void>;
}
