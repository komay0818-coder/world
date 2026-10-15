import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { loadConfig } from '../src/config.js';

const config = loadConfig();
const migrationsDirectory = fileURLToPath(new URL('../migrations', import.meta.url));
const client = new pg.Client({ connectionString: config.databaseUrl, ssl: config.databaseSsl ? { rejectUnauthorized: true } : false });

try {
  await client.connect();
  await client.query(`create table if not exists app_migrations (
    name text primary key,
    checksum text not null,
    applied_at timestamptz not null default now()
  )`);
  const files = (await readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    const sql = await readFile(path.join(migrationsDirectory, name), 'utf8');
    const digest = (await import('node:crypto')).createHash('sha256').update(sql).digest('hex');
    await client.query('begin');
    try {
      await client.query(`select pg_advisory_xact_lock(hashtext('lorn-api-migrations'))`);
      const existing = await client.query<{ checksum: string }>('select checksum from app_migrations where name = $1', [name]);
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== digest) throw new Error(`Applied migration was modified: ${name}`);
        await client.query('commit');
        continue;
      }
      await client.query(sql);
      await client.query('insert into app_migrations(name, checksum) values ($1, $2)', [name, digest]);
      await client.query('commit');
      process.stdout.write(`${JSON.stringify({ level: 'info', event: 'migration_applied', migration: name })}\n`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }
} finally {
  await client.end();
}
