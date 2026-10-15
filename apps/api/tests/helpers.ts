import type { Database, QueryResult } from '../src/database.js';
import type { QueryResultRow } from 'pg';

export function fakeDatabase(handler: (text: string, values?: readonly unknown[]) => QueryResultRow[] = () => [{ ok: 1, current_user: 'test_api' }]): Database {
  return {
    async query<Row extends QueryResultRow>(text: string, values?: readonly unknown[]) {
      const rows = handler(text, values) as Row[];
      return { command: 'SELECT', rowCount: rows.length, oid: 0, fields: [], rows } as QueryResult<Row>;
    },
    async close() {}
  };
}

export const testConfig = {
  appEnv: 'local' as const,
  host: '127.0.0.1',
  port: 3000,
  logLevel: 'silent' as const,
  databaseUrl: 'postgresql://test:test@127.0.0.1:5432/lorn_dev',
  databaseSsl: false,
  supabaseUrl: 'https://dev-example.supabase.co',
  supabaseJwtAudience: 'authenticated'
};
