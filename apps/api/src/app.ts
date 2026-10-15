import Fastify, { type FastifyBaseLogger } from 'fastify';
import type { AppConfig } from './config.js';
import { authenticate, createSupabaseTokenVerifier, type TokenVerifier } from './auth.js';
import { checkDatabase, type Database } from './database.js';
import { findAccountByAuthUserId } from './account-repository.js';

type BuildOptions = {
  config: AppConfig;
  database: Database;
  tokenVerifier?: TokenVerifier;
  logger?: boolean | FastifyBaseLogger;
};

export function buildApp(options: BuildOptions) {
  const app = Fastify({ logger: options.logger ?? { level: options.config.logLevel } });
  const verifyToken = options.tokenVerifier ?? createSupabaseTokenVerifier(options.config);

  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    try {
      await checkDatabase(options.database);
      return { status: 'ready' };
    } catch (error) {
      app.log.warn({ err: error }, 'database readiness check failed');
      return reply.code(503).send({ status: 'not_ready' });
    }
  });

  app.get('/v1/account', { preHandler: authenticate(verifyToken) }, async (request, reply) => {
    const account = await findAccountByAuthUserId(options.database, request.authUser!.id);
    if (!account) return reply.code(404).send({ error: { code: 'ACCOUNT_NOT_FOUND', message: 'Player account has not been created', requestId: request.id } });
    return { account };
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.id, method: request.method, url: request.url }, 'request failed');
    void reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed', requestId: request.id } });
  });

  app.addHook('onClose', async () => options.database.close());
  return app;
}
