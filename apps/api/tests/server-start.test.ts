import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakeDatabase, testConfig } from './helpers.js';

describe('API startup', () => {
  it('binds a local HTTP port and serves liveness', async () => {
    const app = buildApp({
      config: testConfig,
      database: fakeDatabase(),
      tokenVerifier: async () => ({ id: 'unused', claims: {} }),
      logger: false
    });
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    try {
      const response = await fetch(`${address}/health/live`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});
