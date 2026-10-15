import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakeDatabase, testConfig } from './helpers.js';

describe('health endpoints', () => {
  it('reports process liveness without database state', async () => {
    const app = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => ({ id: 'unused', claims: {} }), logger: false });
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('reports readiness only when the database responds', async () => {
    const ready = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => ({ id: 'unused', claims: {} }), logger: false });
    expect((await ready.inject({ method: 'GET', url: '/health/ready' })).statusCode).toBe(200);
    await ready.close();

    const unavailable = buildApp({ config: testConfig, database: { query: async () => { throw new Error('offline'); }, close: async () => {} }, tokenVerifier: async () => ({ id: 'unused', claims: {} }), logger: false });
    expect((await unavailable.inject({ method: 'GET', url: '/health/ready' })).statusCode).toBe(503);
    await unavailable.close();
  });
});
