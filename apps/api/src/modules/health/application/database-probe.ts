export abstract class DatabaseProbe {
  abstract ping(): Promise<void>;
}
export class DatabaseUnavailable extends Error {
  constructor() {
    super('Database connectivity check failed');
    this.name = 'DatabaseUnavailable';
  }
}
