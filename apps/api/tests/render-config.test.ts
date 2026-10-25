import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const blueprint = readFileSync(new URL('../../../render.yaml', import.meta.url), 'utf8');

describe('Render deployment blueprint', () => {
  it('builds and starts the API on the free Node service', () => {
    expect(blueprint).toContain('plan: free');
    expect(blueprint).toContain('rootDir: apps/api');
    expect(blueprint).toContain('pnpm install --frozen-lockfile && pnpm build');
    expect(blueprint).toContain('startCommand: pnpm start');
    expect(blueprint).toContain('healthCheckPath: /health/ready');
    expect(blueprint).toContain('value: 0.0.0.0');
  });

  it('does not run database migrations during deploy or startup', () => {
    expect(blueprint).not.toMatch(/migrate|db:migrate|preDeployCommand/);
  });

  it('requires dashboard values for every environment-specific credential', () => {
    for (const key of [
      'DATABASE_URL',
      'DATABASE_ALLOWED_HOSTS',
      'LORN_DEV_SUPABASE_PROJECT_REF',
      'SUPABASE_URL',
      'SUPABASE_PUBLISHABLE_KEY',
      'FRONTEND_ALLOWED_ORIGINS'
    ]) {
      expect(blueprint).toMatch(new RegExp(`key: ${key}\\s+sync: false`));
    }
  });
});
