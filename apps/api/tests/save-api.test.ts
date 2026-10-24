import { describe, expect, it } from 'vitest';
import type { QueryResultRow } from 'pg';
import { buildApp } from '../src/app.js';
import type { Database, DatabaseTransaction, QueryResult } from '../src/database.js';
import { hashSaveSnapshot, MAX_SAVE_SNAPSHOT_BYTES } from '../src/save-repository.js';
import { testConfig } from './helpers.js';

const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const accountA = '11111111-1111-4111-8111-111111111111';
const accountB = '22222222-2222-4222-8222-222222222222';

type State = {
  accounts: Map<string, { id: string; status: 'active' }>;
  saves: Map<string, Record<string, unknown>>;
  commands: Map<string, Record<string, unknown>>;
  leases: Map<string, Record<string, unknown>>;
};
const leaseId='30000000-0000-4000-8000-000000000001',deviceId='40000000-0000-4000-8000-000000000001';

function result<Row extends QueryResultRow>(rows: Row[], command = 'SELECT'): QueryResult<Row> {
  return { command, rowCount: rows.length, oid: 0, fields: [], rows } as QueryResult<Row>;
}

function cloneState(state: State): State {
  return {
    accounts: new Map(Array.from(state.accounts, ([key, value]) => [key, structuredClone(value)])),
    saves: new Map(Array.from(state.saves, ([key, value]) => [key, structuredClone(value)])),
    commands: new Map(Array.from(state.commands, ([key, value]) => [key, structuredClone(value)])),
    leases: new Map(Array.from(state.leases, ([key, value]) => [key, structuredClone(value)]))
  };
}

function createSaveDatabase(seedLeases=true) {
  let state: State = {
    accounts: new Map([
      [userA, { id: accountA, status: 'active' }],
      [userB, { id: accountB, status: 'active' }]
    ]),
    saves: new Map(),
    commands: new Map(),
    leases: new Map(seedLeases?[accountA, accountB].map(id=>[id,{account_id:id,lease_id:leaseId,device_id:deviceId,state:'active',base_revision:'0',last_committed_revision:'0',acquired_at:'2026-10-21T00:00:00.000Z',renewed_at:'2026-10-21T00:00:00.000Z',expires_at:'2099-10-21T00:00:00.000Z',released_at:null}]):[])
  };
  let transactionTail = Promise.resolve();
  let clock = 0;

  const queryAgainst = async <Row extends QueryResultRow>(target: State, text: string, values?: readonly unknown[]): Promise<QueryResult<Row>> => {
    const compact = text.replace(/\s+/g, ' ').trim().toLowerCase();
    if (compact.startsWith('select id, status from player_accounts')) {
      const account = target.accounts.get(String(values?.[0]));
      return result<Row>(account ? [account as unknown as Row] : []);
    }
    if (compact.includes('from player_game_saves') && compact.startsWith('select schema_version')) {
      const save = target.saves.get(String(values?.[0]));
      return result<Row>(save ? [save as Row] : []);
    }
    if (compact.startsWith('select request_hash')) {
      const receipt = target.commands.get(`${values?.[0]}:${values?.[1]}`);
      return result<Row>(receipt ? [receipt as Row] : []);
    }
    if (compact.startsWith('select revision from player_game_saves')) {
      const save = target.saves.get(String(values?.[0]));
      return result<Row>(save ? [{ revision: save.revision } as unknown as Row] : []);
    }
    if (compact.includes('from player_game_leases') && compact.startsWith('select account_id')) {
      const lease=target.leases.get(String(values?.[0]));
      return result<Row>(lease?[lease as Row]:[]);
    }
    if (compact.startsWith('update player_game_leases set last_committed_revision')) {
      const lease=target.leases.get(String(values?.[0]));
      if(lease&&lease.lease_id===values?.[1])lease.last_committed_revision=String(values?.[2]);
      return result<Row>([], 'UPDATE');
    }
    if (compact.startsWith('insert into player_game_leases')) {
      const accountId=String(values?.[0]);const row={account_id:accountId,lease_id:String(values?.[1]),device_id:String(values?.[2]),state:'active',base_revision:String(values?.[3]),last_committed_revision:String(values?.[3]),acquired_at:values?.[4],renewed_at:values?.[4],expires_at:values?.[5],released_at:null};target.leases.set(accountId,row);return result<Row>([row as unknown as Row],'INSERT');
    }
    if (compact.startsWith('update player_game_leases set renewed_at')) {
      const row=target.leases.get(String(values?.[0]));if(!row)return result<Row>([],'UPDATE');row.renewed_at=values?.[1];row.expires_at=values?.[2];return result<Row>([row as unknown as Row],'UPDATE');
    }
    if (compact.startsWith("update player_game_leases set state='released'")) {
      const row=target.leases.get(String(values?.[0]));if(!row)return result<Row>([],'UPDATE');row.state='released';row.renewed_at=values?.[1];row.expires_at=values?.[1];row.released_at=values?.[1];return result<Row>([row as unknown as Row],'UPDATE');
    }
    if (compact.startsWith('insert into player_game_saves')) {
      const accountId = String(values?.[0]);
      if (target.saves.has(accountId)) return result<Row>([], 'INSERT');
      clock += 1;
      const row = {
        schema_version: Number(values?.[1]), revision: String(values?.[2]),
        snapshot: JSON.parse(String(values?.[3])), content_hash: String(values?.[4]),
        updated_at: `2026-10-21T00:00:${String(clock).padStart(2, '0')}.000Z`
      };
      target.saves.set(accountId, row);
      return result<Row>([row as unknown as Row], 'INSERT');
    }
    if (compact.startsWith('update player_game_saves')) {
      const accountId = String(values?.[0]);
      const existing = target.saves.get(accountId);
      if (!existing || Number(existing.revision) !== Number(values?.[5])) return result<Row>([], 'UPDATE');
      clock += 1;
      const row = {
        schema_version: Number(values?.[1]), revision: String(values?.[2]),
        snapshot: JSON.parse(String(values?.[3])), content_hash: String(values?.[4]),
        updated_at: `2026-10-21T00:00:${String(clock).padStart(2, '0')}.000Z`
      };
      target.saves.set(accountId, row);
      return result<Row>([row as unknown as Row], 'UPDATE');
    }
    if (compact.startsWith('insert into player_save_commands')) {
      const key = `${values?.[0]}:${values?.[1]}`;
      if (target.commands.has(key)) throw new Error('duplicate command');
      target.commands.set(key, {
        request_hash: values?.[2], resulting_revision: String(values?.[3]),
        resulting_schema_version: Number(values?.[4]), resulting_content_hash: values?.[5],
        resulting_updated_at: values?.[6]
      });
      return result<Row>([], 'INSERT');
    }
    throw new Error(`Unexpected save test query: ${compact}`);
  };

  const database: Database = {
    query: (text, values) => queryAgainst(state, text, values),
    async transaction(work) {
      let release!: () => void;
      const prior = transactionTail;
      transactionTail = new Promise<void>((resolve) => { release = resolve; });
      await prior;
      const draft = cloneState(state);
      const transaction: DatabaseTransaction = { query: (text, values) => queryAgainst(draft, text, values) };
      try {
        const value = await work(transaction);
        state = draft;
        return value;
      } finally {
        release();
      }
    },
    async close() {}
  };
  return { database, get state() { return state; } };
}

function snapshot(label = 'initial') {
  return {
    permanent: {
      version: 1, activeMainId: null, accountResources: { gold: 0, goldVersion: 1 },
      characters: {}, slotOrder: [null, null, null, null], parties: {}, bag: { items: [] },
      retiredIds: [], deletedCharacters: {}, equipmentOwners: {}
    },
    farming: { version: 1, owners: {}, sessions: {}, eligibility: {}, legacyDebts: {}, teamOffline: {} },
    cutover: { version: 1, status: 'active', source: 'test' },
    commands: {},
    label
  };
}

function commitPayload(commandId: string, baseRevision: number, saveSnapshot = snapshot()) {
  return {
    leaseId,deviceId,
    commandId,
    baseRevision,
    schemaVersion: 1,
    snapshot: saveSnapshot,
    contentHash: hashSaveSnapshot(saveSnapshot).hash
  };
}

const verifier = async (token: string) => ({ id: token, claims: {} });
const auth = (userId: string) => ({ authorization: `Bearer ${userId}` });

describe('cloud save API', () => {
  it('serializes play permission across devices and allows a clean handoff', async()=>{
    const fixture=createSaveDatabase(false),app=buildApp({config:testConfig,database:fixture.database,tokenVerifier:verifier,logger:false});
    const firstDevice='50000000-0000-4000-8000-000000000001',secondDevice='50000000-0000-4000-8000-000000000002';
    const first=await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:firstDevice}});
    expect(first.statusCode).toBe(200);const firstLease=first.json().lease.leaseId;
    const blocked=await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:secondDevice}});
    expect(blocked.statusCode).toBe(409);expect(blocked.json().error.code).toBe('PLAY_LEASE_ACTIVE');
    const released=await app.inject({method:'POST',url:'/v1/play-lease/release',headers:auth(userA),payload:{deviceId:firstDevice,leaseId:firstLease,cloudRevision:0}});
    expect(released.statusCode).toBe(200);expect(released.json().lease.state).toBe('released');
    const next=await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:secondDevice}});
    expect(next.statusCode).toBe(200);expect(next.json().lease.deviceId).toBe(secondDevice);
    await app.close();
  });

  it('requires the original device to recover an expired dirty lease and rejects its stale commits after handoff',async()=>{
    const fixture=createSaveDatabase(false),app=buildApp({config:testConfig,database:fixture.database,tokenVerifier:verifier,logger:false});
    const firstDevice='60000000-0000-4000-8000-000000000001',secondDevice='60000000-0000-4000-8000-000000000002';
    const first=await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:firstDevice}}),firstLease=first.json().lease.leaseId;
    fixture.state.leases.get(accountA)!.expires_at='2000-01-01T00:00:00.000Z';
    const blocked=await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:secondDevice}});
    expect(blocked.statusCode).toBe(409);expect(blocked.json().error.code).toBe('PLAY_LEASE_RECOVERY_REQUIRED');
    const resumed=await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:firstDevice,resumeLeaseId:firstLease}});
    expect(resumed.statusCode).toBe(200);expect(resumed.json().resumed).toBe(true);
    await app.inject({method:'POST',url:'/v1/play-lease/release',headers:auth(userA),payload:{deviceId:firstDevice,leaseId:firstLease,cloudRevision:0}});
    await app.inject({method:'POST',url:'/v1/play-lease/acquire',headers:auth(userA),payload:{deviceId:secondDevice}});
    const stale=await app.inject({method:'POST',url:'/v1/save/commit',headers:auth(userA),payload:{...commitPayload('10000000-0000-4000-8000-000000000099',0),deviceId:firstDevice,leaseId:firstLease}});
    expect(stale.statusCode).toBe(409);expect(stale.json().error.code).toBe('PLAY_LEASE_LOST');
    await app.close();
  });
  it('creates revision 1 and reads the complete snapshot', async () => {
    const fixture = createSaveDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const payload = commitPayload('10000000-0000-4000-8000-000000000001', 0);
    const created = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ duplicate: false, save: { revision: 1, schemaVersion: 1, contentHash: payload.contentHash } });
    const read = await app.inject({ method: 'GET', url: '/v1/save', headers: auth(userA) });
    expect(read.statusCode).toBe(200);
    expect(read.json().save).toMatchObject({ revision: 1, snapshot: payload.snapshot });
    await app.close();
  });

  it('updates only from the current base revision', async () => {
    const fixture = createSaveDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000002', 0) });
    const updated = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000003', 1, snapshot('updated')) });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().save.revision).toBe(2);
    const stale = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000004', 1, snapshot('stale')) });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.code).toBe('REVISION_CONFLICT');
    await app.close();
  });

  it('returns the original result for an identical command retry and rejects changed content', async () => {
    const fixture = createSaveDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const command = '10000000-0000-4000-8000-000000000005';
    const payload = commitPayload(command, 0);
    const first = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload });
    const retry = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload });
    expect(first.statusCode).toBe(201);
    expect(retry.statusCode).toBe(200);
    expect(retry.json()).toMatchObject({ duplicate: true, save: first.json().save });
    const changed = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload(command, 0, snapshot('changed')) });
    expect(changed.statusCode).toBe(409);
    expect(changed.json().error.code).toBe('COMMAND_ID_REUSED');
    await app.close();
  });

  it('isolates saves by the verified JWT account', async () => {
    const fixture = createSaveDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000006', 0, snapshot('A')) });
    const otherRead = await app.inject({ method: 'GET', url: '/v1/save', headers: auth(userB) });
    expect(otherRead.statusCode).toBe(404);
    const otherWrite = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userB), payload: commitPayload('10000000-0000-4000-8000-000000000007', 0, snapshot('B')) });
    expect(otherWrite.statusCode).toBe(201);
    expect(fixture.state.saves.get(accountA)?.snapshot).toMatchObject({ label: 'A' });
    expect(fixture.state.saves.get(accountB)?.snapshot).toMatchObject({ label: 'B' });
    await app.close();
  });

  it('allows only one of two concurrent commits from the same base revision', async () => {
    const fixture = createSaveDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const responses = await Promise.all([
      app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000008', 0, snapshot('first')) }),
      app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000009', 0, snapshot('second')) })
    ]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
    expect(fixture.state.saves.get(accountA)?.revision).toBe('1');
    expect(Array.from(fixture.state.commands.keys()).filter((key) => key.startsWith(accountA))).toHaveLength(1);
    await app.close();
  });

  it('rejects invalid, oversized, and falsely hashed snapshots', async () => {
    const fixture = createSaveDatabase();
    const app = buildApp({ config: testConfig, database: fixture.database, tokenVerifier: verifier, logger: false });
    const invalid = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: { commandId: '10000000-0000-4000-8000-000000000010', baseRevision: 0, schemaVersion: 1, snapshot: {}, contentHash: '0'.repeat(64) } });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error.code).toBe('INVALID_SAVE_REQUEST');

    const falseHash = commitPayload('10000000-0000-4000-8000-000000000011', 0);
    falseHash.contentHash = '0'.repeat(64);
    const mismatch = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: falseHash });
    expect(mismatch.statusCode).toBe(400);
    expect(mismatch.json().error.code).toBe('CONTENT_HASH_MISMATCH');

    const huge = snapshot('x'.repeat(MAX_SAVE_SNAPSHOT_BYTES));
    const oversized = await app.inject({ method: 'POST', url: '/v1/save/commit', headers: auth(userA), payload: commitPayload('10000000-0000-4000-8000-000000000012', 0, huge) });
    expect(oversized.statusCode).toBe(413);
    expect(oversized.json().error.code).toBe('SAVE_TOO_LARGE');
    expect(fixture.state.saves.size).toBe(0);
    await app.close();
  });
});

