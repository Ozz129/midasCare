import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type DependencyStatus, type HealthResponse } from '@care/api-contracts';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { APP_CONFIG } from '../config/app-config.module';
import { type AppConfig } from '../config/environment';

const SERVICE_NAME = 'midas-care-api';

function readVersion(): string {
  try {
    // Misma ruta relativa desde src/health y dist/health.
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

const VERSION = readVersion();

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async check(): Promise<HealthResponse> {
    const database = await this.checkDatabase();
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: SERVICE_NAME,
      version: VERSION,
      environment: this.config.nodeEnv,
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    if (!this.dataSource.isInitialized) return 'down';
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
