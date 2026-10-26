import 'dotenv/config';
import { loadConfig } from './config.js';
import { createDatabase, checkDatabase } from './database.js';
import { buildApp } from './app.js';
import { assertLornDevRuntimeTarget } from './migration-safety.js';

async function start(): Promise<void> {
  const config = loadConfig();
  if (process.env.RENDER === 'true') assertLornDevRuntimeTarget(config);
  const database = createDatabase(config);
  await checkDatabase(database);
  const app = buildApp({ config, database });
  await app.listen({ host: config.host, port: config.port });

  let closing = false;
  const shutdown = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    await app.close();
  };
  const requestShutdown = (): void => {
    void shutdown().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${JSON.stringify({ level: 'error', time: new Date().toISOString(), event: 'api_shutdown_failed', message })}\n`);
      process.exitCode = 1;
    });
  };
  process.once('SIGTERM', requestShutdown);
  process.once('SIGINT', requestShutdown);
}

start().catch((error: unknown) => {
  const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
  process.stderr.write(`${JSON.stringify({ level: 'fatal', time: new Date().toISOString(), event: 'api_start_failed', error: details })}\n`);
  process.exitCode = 1;
});
