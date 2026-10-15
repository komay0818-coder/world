import { X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import type { AppConfig } from './config.js';

export type QueryResult<Row extends pg.QueryResultRow = pg.QueryResultRow> = pg.QueryResult<Row>;

export interface Database {
  query<Row extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<Row>>;
  close(): Promise<void>;
}

function readTrustedDatabaseCa(certificatePath: string): Buffer {
  const certificate = readFileSync(certificatePath);
  const parsed = new X509Certificate(certificate);
  const now = Date.now();
  if (!parsed.ca) throw new Error('Configured database certificate is not a CA certificate');
  if (now < Date.parse(parsed.validFrom) || now > Date.parse(parsed.validTo)) {
    throw new Error('Configured database CA certificate is not currently valid');
  }
  return certificate;
}

export function createDatabaseSslConfig(config: AppConfig): false | { rejectUnauthorized: true; ca: Buffer } {
  if (!config.databaseSsl) return false;
  if (!config.databaseCaCertPath) {
    throw new Error('Database CA certificate path is required when TLS is enabled');
  }
  return {
    rejectUnauthorized: true,
    ca: readTrustedDatabaseCa(config.databaseCaCertPath)
  };
}

export function createDatabase(config: AppConfig): Database {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: createDatabaseSslConfig(config),
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
