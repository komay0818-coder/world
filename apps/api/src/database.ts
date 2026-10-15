import pg from 'pg';
import type { AppConfig } from './config.js';

export type QueryResult<Row extends pg.QueryResultRow = pg.QueryResultRow> = pg.QueryResult<Row>;

export interface Database {
  query<Row extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<Row>>;
  close(): Promise<void>;
}

export function createDatabase(config: AppConfig): Database {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: `lorn-api-${config.appEnv}`
  });

  return {
    query: (text, values) => pool.query(text, values as unknown[] | undefined),
    close: () => pool.end()
  };
}

export async function checkDatabase(database: Database): Promise<void> {
  const result = await database.query<{ ok: number; current_user: string }>('select 1 as ok, current_user');
  if (result.rows[0]?.ok !== 1) throw new Error('Database readiness query returned an invalid result');
}
