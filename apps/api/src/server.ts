import 'dotenv/config';
import { loadConfig } from './config.js';
import { createDatabase, checkDatabase } from './database.js';
import { buildApp } from './app.js';

async function start(): Promise<void> {
  const config = loadConfig();
  const database = createDatabase(config);
  await checkDatabase(database);
  const app = buildApp({ config, database });
  await app.listen({ host: config.host, port: config.port });
}

start().catch((error: unknown) => {
  const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
  process.stderr.write(`${JSON.stringify({ level: 'fatal', time: new Date().toISOString(), event: 'api_start_failed', error: details })}\n`);
  process.exitCode = 1;
});
