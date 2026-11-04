import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { parseList } from '@care/shared-utils';

export const NODE_ENVIRONMENTS = ['development', 'staging', 'production', 'test'] as const;
export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return value;
};

const toInteger = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

/**
 * Variables de entorno del backend. Se validan al arrancar: si alguna es
 * inválida, la aplicación NO inicia (fail-fast).
 */
export class EnvironmentVariables {
  @IsIn(NODE_ENVIRONMENTS)
  NODE_ENV: NodeEnvironment = 'development';

  @Transform(toInteger)
  @IsInt()
  @Min(1)
  @Max(65535)
  API_PORT = 3000;

  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  API_PUBLIC_URL!: string;

  /** Orígenes permitidos para CORS, separados por comas. No se admite `*`. */
  @IsString()
  @MinLength(1)
  CORS_ORIGINS!: string;

  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['postgres', 'postgresql'] })
  DATABASE_URL!: string;

  @Transform(toBoolean)
  @IsBoolean()
  DATABASE_SSL = false;

  @Transform(toBoolean)
  @IsBoolean()
  DATABASE_LOGGING = false;

  @Transform(toInteger)
  @IsInt()
  @Min(0)
  @Max(20)
  DATABASE_RETRY_ATTEMPTS = 3;

  /** Swagger se habilita por defecto solo en development. */
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED?: boolean;

  @IsIn(['local'])
  STORAGE_DRIVER = 'local' as const;

  @IsString()
  @MinLength(1)
  STORAGE_LOCAL_PATH = './storage';

  /** Secreto HMAC para firmar los access tokens (JWT HS256). Mínimo 32 caracteres. */
  @IsString()
  @MinLength(32)
  AUTH_ACCESS_TOKEN_SECRET!: string;

  @Transform(toInteger)
  @IsInt()
  @Min(60)
  @Max(3600)
  AUTH_ACCESS_TOKEN_TTL_SECONDS = 900;

  @Transform(toInteger)
  @IsInt()
  @Min(3600)
  @Max(7_776_000)
  AUTH_REFRESH_TOKEN_TTL_SECONDS = 2_592_000;
}

export interface AppConfig {
  nodeEnv: NodeEnvironment;
  port: number;
  publicUrl: string;
  corsOrigins: string[];
  swaggerEnabled: boolean;
  database: {
    url: string;
    ssl: boolean;
    logging: boolean;
    retryAttempts: number;
  };
  storage: {
    driver: 'local';
    localPath: string;
  };
  auth: {
    accessTokenSecret: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
    /** Cookies `Secure` (solo HTTPS) fuera de development/test. */
    secureCookies: boolean;
  };
}

export class EnvironmentValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Configuración de entorno inválida:\n  - ${problems.join('\n  - ')}`);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Valida variables de entorno y construye la configuración tipada.
 * Los mensajes de error nunca incluyen los valores (pueden ser secretos).
 */
export function loadAppConfig(raw: Record<string, unknown>): AppConfig {
  const env = plainToInstance(EnvironmentVariables, raw, { exposeDefaultValues: true });
  const errors = validateSync(env, { skipMissingProperties: false, forbidUnknownValues: true });

  const problems = errors.map(
    (error) =>
      `${error.property}: ${Object.keys(error.constraints ?? {}).join(', ') || 'inválida'}`,
  );

  const corsOrigins = parseList(env.CORS_ORIGINS);
  if (corsOrigins.includes('*')) {
    problems.push('CORS_ORIGINS: no se permite el comodín "*"; declara orígenes explícitos');
  }
  for (const origin of corsOrigins) {
    if (origin !== '*' && !/^https?:\/\/[^/\s]+$/.test(origin)) {
      problems.push(`CORS_ORIGINS: origen con formato inválido (esperado esquema://host[:puerto])`);
      break;
    }
  }

  if (problems.length > 0) {
    throw new EnvironmentValidationError(problems);
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    publicUrl: env.API_PUBLIC_URL,
    corsOrigins,
    swaggerEnabled: env.SWAGGER_ENABLED ?? env.NODE_ENV === 'development',
    database: {
      url: env.DATABASE_URL,
      ssl: env.DATABASE_SSL,
      logging: env.DATABASE_LOGGING,
      retryAttempts: env.DATABASE_RETRY_ATTEMPTS,
    },
    storage: {
      driver: env.STORAGE_DRIVER,
      localPath: env.STORAGE_LOCAL_PATH,
    },
    auth: {
      accessTokenSecret: env.AUTH_ACCESS_TOKEN_SECRET,
      accessTokenTtlSeconds: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenTtlSeconds: env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
      secureCookies: env.NODE_ENV === 'staging' || env.NODE_ENV === 'production',
    },
  };
}
