import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { checkDatabase, createDatabase } from '../src/database.js';

const enabled = process.env.RUN_DB_INTEGRATION === '1';

describe.runIf(enabled)('Dev PostgreSQL integration', () => {
  it('connects and has no direct anon/authenticated table grants', async () => {
    const config = loadConfig();
    const database = createDatabase(config);
    try {
      await checkDatabase(database);
      const result = await database.query<{ anon_write: boolean; authenticated_write: boolean }>(`
        select
          coalesce(has_table_privilege(to_regrole('anon'), 'player_accounts', 'insert,update,delete'), false) as anon_write,
          coalesce(has_table_privilege(to_regrole('authenticated'), 'player_accounts', 'insert,update,delete'), false) as authenticated_write
      `);
      expect(result.rows[0]).toEqual({ anon_write: false, authenticated_write: false });
    } finally {
      await database.close();
    }
  });
});
