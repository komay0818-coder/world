import { z } from 'zod';

const environmentSchema = z.object({
  APP_ENV: z.enum(['local', 'dev']),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().url(),
  DATABASE_ALLOWED_HOSTS: z.string().min(1),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  DATABASE_CA_CERT_PATH: z.string().optional(),
  LORN_DEV_SUPABASE_PROJECT_REF: z.string().regex(/^[a-z0-9]+$/).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_JWT_AUDIENCE: z.string().min(1).default('authenticated')
});

export type AppConfig = {
  appEnv: 'local' | 'dev';
  host: string;
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  databaseUrl: string;
  databaseSsl: boolean;
  databaseCaCertPath: string | null;
  lornDevSupabaseProjectRef: string | null;
  supabaseUrl: string;
  supabaseJwtAudience: string;
};

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Unsafe or incomplete backend configuration: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  }

  const database = new URL(parsed.data.DATABASE_URL);
  const allowedHosts = new Set(parsed.data.DATABASE_ALLOWED_HOSTS.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean));
  if (!allowedHosts.has(database.hostname.toLowerCase())) {
    throw new Error(`Database host is not explicitly allowed for ${parsed.data.APP_ENV}: ${database.hostname}`);
  }

  const databaseName = decodeURIComponent(database.pathname.replace(/^\//, '')).toLowerCase();
  if (!databaseName || /(^|[_-])(prod|production|live)([_-]|$)/.test(databaseName)) {
    throw new Error('Production-like or missing database name is blocked in backend phase 1A');
  }

  const databaseSsl = parsed.data.DATABASE_SSL === 'true';
  const databaseCaCertPath = parsed.data.DATABASE_CA_CERT_PATH?.trim() || null;
  if (databaseSsl && !databaseCaCertPath) {
    throw new Error('DATABASE_CA_CERT_PATH is required when DATABASE_SSL=true');
  }

  return {
    appEnv: parsed.data.APP_ENV,
    host: parsed.data.HOST,
    port: parsed.data.PORT,
    logLevel: parsed.data.LOG_LEVEL,
    databaseUrl: parsed.data.DATABASE_URL,
    databaseSsl,
    databaseCaCertPath,
    lornDevSupabaseProjectRef: parsed.data.LORN_DEV_SUPABASE_PROJECT_REF ?? null,
    supabaseUrl: parsed.data.SUPABASE_URL.replace(/\/$/, ''),
    supabaseJwtAudience: parsed.data.SUPABASE_JWT_AUDIENCE
  };
}
