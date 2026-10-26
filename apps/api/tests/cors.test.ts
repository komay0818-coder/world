import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakeDatabase, testConfig } from './helpers.js';
import { API_CAPABILITIES, API_CONTRACT_VERSION, API_ROUTES } from '../src/api-contract.js';

const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => { while (apps.length) await apps.pop()!.close(); });

describe('development browser CORS', () => {
  it('allows only the configured local account UI origin', async () => {
    const app = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => ({ id: 'unused', claims: {} }), logger: false });
    apps.push(app);
    const allowed = await app.inject({ method: 'OPTIONS', url: '/v1/account', headers: { origin: 'http://127.0.0.1:8771', 'access-control-request-method': 'GET', 'access-control-request-headers': 'authorization' } });
    expect(allowed.statusCode).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://127.0.0.1:8771');
    expect(allowed.headers['access-control-allow-credentials']).toBeUndefined();
    const blocked = await app.inject({ method: 'OPTIONS', url: '/v1/account', headers: { origin: 'https://example.com', 'access-control-request-method': 'GET' } });
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('exposes only public lorn-dev browser configuration', async () => {
    const app = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => ({ id: 'unused', claims: {} }), logger: false });
    apps.push(app);
    const response = await app.inject({ method: 'GET', url: '/v1/config/public' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ environment: 'local', expectedProjectRef: null, supabaseUrl: testConfig.supabaseUrl, publishableKey: testConfig.supabasePublishableKey, apiBaseUrl: 'http://127.0.0.1:3000', apiContractVersion: API_CONTRACT_VERSION, apiCapabilities: API_CAPABILITIES });
    expect(response.body).not.toMatch(/database|secret|service.role/i);
  });

  it('registers every API capability advertised to the browser', async () => {
    const app = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => ({ id: 'unused', claims: {} }), logger: false });
    apps.push(app);
    for (const route of Object.values(API_ROUTES)) {
      const response = await app.inject({ method: route.method, url: route.path });
      expect(response.statusCode, `${route.method} ${route.path}`).not.toBe(404);
      expect(response.statusCode, `${route.method} ${route.path}`).not.toBe(405);
    }
  });
});
