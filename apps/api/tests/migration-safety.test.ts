import { describe, expect, it } from 'vitest';
import type { AppConfig } from '../src/config.js';
import { assertLornDevMigrationTarget } from '../src/migration-safety.js';

const safeConfig: AppConfig = {
  appEnv: 'dev',
  host: '127.0.0.1',
  port: 3000,
  logLevel: 'silent',
  databaseUrl: 'postgresql://postgres.devproject:password@pooler.supabase.com:5432/postgres',
  databaseSsl: true,
  databaseCaCertPath: 'C:\\certs\\dev-ca.crt',
  lornDevSupabaseProjectRef: 'devproject',
  supabaseUrl: 'https://devproject.supabase.co',
  supabaseJwtAudience: 'authenticated',
  supabasePublishableKey: 'sb_publishable_test_key',
  frontendAllowedOrigins: ['http://127.0.0.1:8771']
};

describe('assertLornDevMigrationTarget', () => {
  it('accepts the pinned lorn-dev project when API and database identifiers match', () => {
    expect(() => assertLornDevMigrationTarget(safeConfig)).not.toThrow();
  });

  it('rejects a database from a different Supabase project', () => {
    expect(() => assertLornDevMigrationTarget({
      ...safeConfig,
      databaseUrl: 'postgresql://postgres.otherproject:password@pooler.supabase.com:5432/postgres'
    })).toThrow(/does not match/);
  });

  it('rejects a Supabase API URL from a different project', () => {
    expect(() => assertLornDevMigrationTarget({
      ...safeConfig,
      supabaseUrl: 'https://otherproject.supabase.co'
    })).toThrow(/does not match/);
  });

  it('rejects an unidentifiable database project', () => {
    expect(() => assertLornDevMigrationTarget({
      ...safeConfig,
      databaseUrl: 'postgresql://postgres:password@pooler.supabase.com:5432/postgres'
    })).toThrow(/Unable to identify/);
  });

  it('rejects non-dev application environments', () => {
    expect(() => assertLornDevMigrationTarget({ ...safeConfig, appEnv: 'local' })).toThrow(/APP_ENV=dev/);
  });

  it('rejects migrations without verified TLS', () => {
    expect(() => assertLornDevMigrationTarget({ ...safeConfig, databaseSsl: false })).toThrow(/verified database TLS/);
  });

  it('rejects migrations without an explicitly pinned lorn-dev project ref', () => {
    expect(() => assertLornDevMigrationTarget({ ...safeConfig, lornDevSupabaseProjectRef: null })).toThrow(/LORN_DEV_SUPABASE_PROJECT_REF/);
  });
});
