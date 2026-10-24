import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const base = {
  APP_ENV: 'dev', HOST: '127.0.0.1', PORT: '3000', LOG_LEVEL: 'info',
  DATABASE_URL: 'postgresql://user:password@db.dev.internal:5432/lorn_dev',
  DATABASE_ALLOWED_HOSTS: 'db.dev.internal', DATABASE_SSL: 'true',
  DATABASE_CA_CERT_PATH: 'C:\\certs\\dev-ca.crt',
  SUPABASE_URL: 'https://dev-project.supabase.co', SUPABASE_JWT_AUDIENCE: 'authenticated', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key'
};

describe('loadConfig', () => {
  it('accepts an explicitly allow-listed Dev database', () => {
    expect(loadConfig(base).appEnv).toBe('dev');
  });

  it('requires a CA certificate path when database TLS is enabled', () => {
    const { DATABASE_CA_CERT_PATH: _, ...withoutCa } = base;
    expect(() => loadConfig(withoutCa)).toThrow(/DATABASE_CA_CERT_PATH/);
  });

  it('stops when required Dev configuration is absent', () => {
    expect(() => loadConfig({})).toThrow(/Unsafe or incomplete/);
  });

  it('rejects production application mode', () => {
    expect(() => loadConfig({ ...base, APP_ENV: 'production' })).toThrow(/APP_ENV/);
  });

  it('rejects a database host that is not explicitly allowed', () => {
    expect(() => loadConfig({ ...base, DATABASE_ALLOWED_HOSTS: 'localhost' })).toThrow(/not explicitly allowed/);
  });

  it.each(['lorn_prod', 'production', 'game-live'])('rejects production-like database name %s', (name) => {
    expect(() => loadConfig({ ...base, DATABASE_URL: `postgresql://user:password@db.dev.internal:5432/${name}` })).toThrow(/Production-like/);
  });
});
