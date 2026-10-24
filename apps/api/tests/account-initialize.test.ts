import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import type { Database, QueryResult } from '../src/database.js';
import type { QueryResultRow } from 'pg';
import { testConfig } from './helpers.js';

const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

type StoredRow = {
  id: string;
  auth_user_id: string;
  status: 'active' | 'suspended' | 'closed';
  data_version: string;
  created_at: string;
  updated_at: string;
};

function queryResult<Row extends QueryResultRow>(rows: Row[], command = 'SELECT'): QueryResult<Row> {
  return { command, rowCount: rows.length, oid: 0, fields: [], rows } as QueryResult<Row>;
}

function createAccountDatabase(initialRows: StoredRow[] = []) {
  const rows = new Map(initialRows.map((row) => [row.auth_user_id, row]));
  let sequence = rows.size;
  const database: Database = {
    async query<Row extends QueryResultRow>(text: string, values?: readonly unknown[]) {
      const authUserId = String(values?.[0] ?? '');
      if (/insert\s+into\s+player_accounts/i.test(text)) {
        expect(text).toMatch(/on\s+conflict\s*\(auth_user_id\)\s+do\s+nothing/i);
        await new Promise<void>((resolve) => setImmediate(resolve));
        if (rows.has(authUserId)) return queryResult<Row>([], 'INSERT');
        sequence += 1;
        const now = '2026-10-17T00:00:00.000Z';
        const row: StoredRow = {
          id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
          auth_user_id: authUserId,
          status: 'active',
          data_version: '0',
          created_at: now,
          updated_at: now
        };
        rows.set(authUserId, row);
        return queryResult<Row>([row as unknown as Row], 'INSERT');
      }
      if (/select\s+id,\s*auth_user_id/i.test(text)) {
        const row = rows.get(authUserId);
        return queryResult<Row>(row ? [row as unknown as Row] : []);
      }
      throw new Error('Unexpected query in account initialization test');
    },
    async transaction(work) { return work(this); },
    async close() {}
  };
  return { database, rows };
}

const verifier = async (token: string) => ({ id: token, claims: {} });
const authorization = (id: string) => ({ authorization: `Bearer ${id}` });

describe('POST /v1/account/initialize', () => {
  it('initializes an account only from the verified JWT subject', async () => {
    const fixture = createAccountDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const response = await app.inject({
      method: 'POST', url: '/v1/account/initialize', headers: authorization(userA),
      payload: { authUserId: userB }
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().account).toMatchObject({ authUserId: userA, status: 'active', dataVersion: 0 });
    expect(fixture.rows.has(userA)).toBe(true);
    expect(fixture.rows.has(userB)).toBe(false);
    await app.close();
  });

  it.each(['invalid', 'expired'])('rejects an %s token', async () => {
    const fixture = createAccountDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: async () => { throw new Error('rejected token'); }, logger: false });
    const response = await app.inject({ method: 'POST', url: '/v1/account/initialize', headers: { authorization: 'Bearer rejected' } });
    expect(response.statusCode).toBe(401);
    expect(fixture.rows.size).toBe(0);
    await app.close();
  });

  it('rejects a non-UUID JWT subject', async () => {
    const fixture = createAccountDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: async () => ({ id: 'not-a-uuid', claims: {} }), logger: false });
    const response = await app.inject({ method: 'POST', url: '/v1/account/initialize', headers: { authorization: 'Bearer valid-signature' } });
    expect(response.statusCode).toBe(401);
    expect(fixture.rows.size).toBe(0);
    await app.close();
  });

  it('returns the existing account without creating a second row', async () => {
    const fixture = createAccountDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const first = await app.inject({ method: 'POST', url: '/v1/account/initialize', headers: authorization(userA) });
    const second = await app.inject({ method: 'POST', url: '/v1/account/initialize', headers: authorization(userA) });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.json().account.id).toBe(first.json().account.id);
    expect(fixture.rows.size).toBe(1);
    await app.close();
  });

  it('creates only one row under concurrent initialization', async () => {
    const fixture = createAccountDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const responses = await Promise.all(Array.from({ length: 12 }, () => app.inject({
      method: 'POST', url: '/v1/account/initialize', headers: authorization(userA)
    })));
    expect(responses.filter((response) => response.statusCode === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.statusCode === 200)).toHaveLength(11);
    expect(new Set(responses.map((response) => response.json().account.id)).size).toBe(1);
    expect(fixture.rows.size).toBe(1);
    await app.close();
  });

  it('does not overwrite an existing account', async () => {
    const original: StoredRow = {
      id: '11111111-1111-4111-8111-111111111111', auth_user_id: userA,
      status: 'suspended', data_version: '9',
      created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-02T00:00:00.000Z'
    };
    const fixture = createAccountDatabase([original]);
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const response = await app.inject({ method: 'POST', url: '/v1/account/initialize', headers: authorization(userA) });
    expect(response.statusCode).toBe(200);
    expect(response.json().account).toMatchObject({ id: original.id, status: 'suspended', dataVersion: 9 });
    expect(fixture.rows.get(userA)).toEqual(original);
    await app.close();
  });

  it('does not let another user read the initialized account', async () => {
    const fixture = createAccountDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    await app.inject({ method: 'POST', url: '/v1/account/initialize', headers: authorization(userA) });
    const response = await app.inject({ method: 'GET', url: '/v1/account', headers: authorization(userB) });
    expect(response.statusCode).toBe(404);
    expect(fixture.rows.size).toBe(1);
    await app.close();
  });
});
