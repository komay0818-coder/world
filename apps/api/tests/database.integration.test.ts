import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { checkDatabase, createDatabase } from '../src/database.js';
import { commitGameSave, findGameSaveByAuthUserId, hashSaveSnapshot } from '../src/save-repository.js';
import { acquirePlayLease, releasePlayLease } from '../src/play-lease-repository.js';

const enabled = process.env.RUN_DB_INTEGRATION === '1';

describe.runIf(enabled)('Dev PostgreSQL integration', () => {
  it('connects and has no direct anon/authenticated table grants', async () => {
    const config = loadConfig();
    const database = createDatabase(config);
    try {
      await checkDatabase(database);
      const result = await database.query<{
        anon_account_access: boolean;
        authenticated_account_access: boolean;
        anon_save_access: boolean;
        authenticated_save_access: boolean;
        saves_rls: boolean;
        commands_rls: boolean;
        anon_lease_access: boolean;
        authenticated_lease_access: boolean;
        leases_rls: boolean;
      }>(`
        select
          coalesce(has_table_privilege(to_regrole('anon'), 'player_accounts', 'select,insert,update,delete'), false) as anon_account_access,
          coalesce(has_table_privilege(to_regrole('authenticated'), 'player_accounts', 'select,insert,update,delete'), false) as authenticated_account_access,
          coalesce(has_table_privilege(to_regrole('anon'), 'player_game_saves', 'select,insert,update,delete'), false) as anon_save_access,
          coalesce(has_table_privilege(to_regrole('authenticated'), 'player_game_saves', 'select,insert,update,delete'), false) as authenticated_save_access,
          (select relrowsecurity from pg_class where oid = 'player_game_saves'::regclass) as saves_rls,
          (select relrowsecurity from pg_class where oid = 'player_save_commands'::regclass) as commands_rls,
          coalesce(has_table_privilege(to_regrole('anon'), 'player_game_leases', 'select,insert,update,delete'), false) as anon_lease_access,
          coalesce(has_table_privilege(to_regrole('authenticated'), 'player_game_leases', 'select,insert,update,delete'), false) as authenticated_lease_access,
          (select relrowsecurity from pg_class where oid = 'player_game_leases'::regclass) as leases_rls
      `);
      expect(result.rows[0]).toEqual({
        anon_account_access: false,
        authenticated_account_access: false,
        anon_save_access: false,
        authenticated_save_access: false,
        saves_rls: true,
        commands_rls: true,
        anon_lease_access: false,
        authenticated_lease_access: false,
        leases_rls: true
      });
    } finally {
      await database.close();
    }
  });

  it('enforces one real database play lease, clean handoff, revision protection, and expiry', async()=>{
    const config=loadConfig(),database=createDatabase(config),authUserId=randomUUID(),firstDevice=randomUUID(),secondDevice=randomUUID();
    const snapshot={permanent:{version:1,activeMainId:null,accountResources:{gold:0,goldVersion:1},characters:{},slotOrder:[null,null,null,null],parties:{},bag:{items:[]},retiredIds:[],deletedCharacters:{},equipmentOwners:{}},farming:{version:1,owners:{},sessions:{},eligibility:{},legacyDebts:{},teamOffline:{}},cutover:{version:1,status:'active',source:'lease-integration-test'},commands:{}};
    try{
      await database.query('insert into player_accounts (auth_user_id) values ($1)',[authUserId]);
      const first=await acquirePlayLease(database,authUserId,{deviceId:firstDevice});
      await expect(acquirePlayLease(database,authUserId,{deviceId:secondDevice})).rejects.toMatchObject({code:'PLAY_LEASE_ACTIVE',statusCode:409});
      const contentHash=hashSaveSnapshot(snapshot).hash;
      const saved=await commitGameSave(database,authUserId,{deviceId:firstDevice,leaseId:first.lease.leaseId,commandId:randomUUID(),baseRevision:0,schemaVersion:1,snapshot,contentHash});
      expect(saved.save.revision).toBe(1);
      const released=await releasePlayLease(database,authUserId,{deviceId:firstDevice,leaseId:first.lease.leaseId,cloudRevision:1});
      expect(released.lease.state).toBe('released');
      const second=await acquirePlayLease(database,authUserId,{deviceId:secondDevice});
      await expect(commitGameSave(database,authUserId,{deviceId:firstDevice,leaseId:first.lease.leaseId,commandId:randomUUID(),baseRevision:1,schemaVersion:1,snapshot:{...snapshot,label:'stale-device'},contentHash:hashSaveSnapshot({...snapshot,label:'stale-device'}).hash})).rejects.toMatchObject({code:'PLAY_LEASE_LOST'});
      await expect(commitGameSave(database,authUserId,{deviceId:secondDevice,leaseId:second.lease.leaseId,commandId:randomUUID(),baseRevision:0,schemaVersion:1,snapshot:{...snapshot,label:'stale-revision'},contentHash:hashSaveSnapshot({...snapshot,label:'stale-revision'}).hash})).rejects.toMatchObject({code:'REVISION_CONFLICT'});
      await database.query("update player_game_leases set acquired_at=now()-interval '2 minutes', renewed_at=now()-interval '2 minutes', expires_at=now()-interval '1 minute' where account_id=(select id from player_accounts where auth_user_id=$1)",[authUserId]);
      await expect(commitGameSave(database,authUserId,{deviceId:secondDevice,leaseId:second.lease.leaseId,commandId:randomUUID(),baseRevision:1,schemaVersion:1,snapshot:{...snapshot,label:'expired'},contentHash:hashSaveSnapshot({...snapshot,label:'expired'}).hash})).rejects.toMatchObject({code:'PLAY_LEASE_EXPIRED'});
    }finally{await database.query('delete from player_accounts where auth_user_id=$1',[authUserId]);await database.close();}
  });

  it('commits and reads an isolated cloud save without retaining test data', async () => {
    const config = loadConfig();
    const database = createDatabase(config);
    const authUserId = randomUUID();
    const commandId = randomUUID();
    const deviceId = randomUUID();
    const snapshot = {
      permanent: {
        version: 1, activeMainId: null, accountResources: { gold: 0, goldVersion: 1 },
        characters: {}, slotOrder: [null, null, null, null], parties: {}, bag: { items: [] },
        retiredIds: [], deletedCharacters: {}, equipmentOwners: {}
      },
      farming: { version: 1, owners: {}, sessions: {}, eligibility: {}, legacyDebts: {}, teamOffline: {} },
      cutover: { version: 1, status: 'active', source: 'database-integration-test' },
      commands: {}
    };
    try {
      await database.query('insert into player_accounts (auth_user_id) values ($1)', [authUserId]);
      const lease = await acquirePlayLease(database, authUserId, { deviceId });
      const contentHash = hashSaveSnapshot(snapshot).hash;
      const identity = { deviceId, leaseId: lease.lease.leaseId };
      const first = await commitGameSave(database, authUserId, { ...identity, commandId, baseRevision: 0, schemaVersion: 1, snapshot, contentHash });
      const retry = await commitGameSave(database, authUserId, { ...identity, commandId, baseRevision: 0, schemaVersion: 1, snapshot, contentHash });
      const read = await findGameSaveByAuthUserId(database, authUserId);
      expect(first).toMatchObject({ duplicate: false, save: { revision: 1, contentHash } });
      expect(retry).toMatchObject({ duplicate: true, save: { revision: 1, contentHash } });
      expect(read).toMatchObject({ revision: 1, snapshot });
    } finally {
      await database.query('delete from player_accounts where auth_user_id = $1', [authUserId]);
      await database.close();
    }
  });
});
