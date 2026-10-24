import type { AppConfig } from './config.js';

function apiProjectRef(supabaseUrl: string): string | null {
  const hostname = new URL(supabaseUrl).hostname.toLowerCase();
  return hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1] ?? null;
}

function databaseProjectRef(databaseUrl: string): string | null {
  const database = new URL(databaseUrl);
  const hostnameRef = database.hostname.toLowerCase().match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1] ?? null;
  const usernameRef = decodeURIComponent(database.username).toLowerCase().match(/^postgres\.([a-z0-9]+)$/)?.[1] ?? null;
  if (hostnameRef && usernameRef && hostnameRef !== usernameRef) {
    throw new Error('Database host and username identify different Supabase projects');
  }
  return hostnameRef ?? usernameRef;
}

export function assertLornDevRuntimeTarget(config: AppConfig): void {
  if (config.appEnv !== 'dev') throw new Error('Hosted API is restricted to APP_ENV=dev');
  if (!config.databaseSsl) throw new Error('Hosted API requires verified database TLS');
  if (!config.lornDevSupabaseProjectRef) throw new Error('LORN_DEV_SUPABASE_PROJECT_REF is required for the hosted API');

  const apiRef = apiProjectRef(config.supabaseUrl);
  const databaseRef = databaseProjectRef(config.databaseUrl);
  if (!apiRef || !databaseRef) throw new Error('Unable to identify the Supabase project for the hosted API');
  if (apiRef !== databaseRef || apiRef !== config.lornDevSupabaseProjectRef) {
    throw new Error('Hosted API target does not match the pinned lorn-dev Supabase project');
  }
}

export function assertLornDevMigrationTarget(config: AppConfig): void {
  assertLornDevRuntimeTarget(config);
}
