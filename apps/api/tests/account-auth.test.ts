import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { fakeDatabase, testConfig } from './helpers.js';

const accountRow = {
  id: '11111111-1111-4111-8111-111111111111',
  auth_user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  status: 'active', data_version: '3',
  created_at: '2026-10-16T00:00:00.000Z', updated_at: '2026-10-16T00:00:00.000Z'
};

describe('GET /v1/account', () => {
  it('rejects a request without a token', async () => {
    const app = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => { throw new Error('unused'); }, logger: false });
    expect((await app.inject({ method: 'GET', url: '/v1/account' })).statusCode).toBe(401);
    await app.close();
  });

  it('rejects an invalid token', async () => {
    const app = buildApp({ config: testConfig, database: fakeDatabase(), tokenVerifier: async () => { throw new Error('invalid'); }, logger: false });
    expect((await app.inject({ method: 'GET', url: '/v1/account', headers: { authorization: 'Bearer invalid' } })).statusCode).toBe(401);
    await app.close();
  });

  it('queries only the account belonging to the verified JWT subject', async () => {
    let queriedSubject: unknown;
    const database = fakeDatabase((_text, values) => { queriedSubject = values?.[0]; return [accountRow]; });
    const app = buildApp({ config: testConfig, database, tokenVerifier: async () => ({ id: accountRow.auth_user_id, claims: {} }), logger: false });
    const response = await app.inject({ method: 'GET', url: '/v1/account', headers: { authorization: 'Bearer valid' } });
    expect(response.statusCode).toBe(200);
    expect(queriedSubject).toBe(accountRow.auth_user_id);
    expect(response.json().account).toMatchObject({ id: accountRow.id, authUserId: accountRow.auth_user_id, dataVersion: 3 });
    await app.close();
  });

  it('cannot select another account through request parameters', async () => {
    let queriedSubject: unknown;
    const database = fakeDatabase((_text, values) => { queriedSubject = values?.[0]; return []; });
    const app = buildApp({ config: testConfig, database, tokenVerifier: async () => ({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', claims: {} }), logger: false });
    const response = await app.inject({ method: 'GET', url: '/v1/account?accountId=other-user', headers: { authorization: 'Bearer valid' } });
    expect(response.statusCode).toBe(404);
    expect(queriedSubject).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    await app.close();
  });
});
