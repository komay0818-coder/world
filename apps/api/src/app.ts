import Fastify, { type FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import type { AppConfig } from './config.js';
import { authenticate, createSupabaseTokenVerifier, type TokenVerifier } from './auth.js';
import { checkDatabase, type Database } from './database.js';
import { findAccountByAuthUserId, initializeAccountByAuthUserId } from './account-repository.js';
import { commitGameSave, findGameSaveByAuthUserId, MAX_SAVE_SNAPSHOT_BYTES, saveCommitSchema, SaveApiError } from './save-repository.js';
import { acquirePlayLease, leaseAcquireSchema, leaseIdentitySchema, leaseReleaseSchema, PlayLeaseError, releasePlayLease, renewPlayLease } from './play-lease-repository.js';
import { ZodError } from 'zod';
import { API_CAPABILITIES, API_CONTRACT_VERSION, API_ROUTES } from './api-contract.js';

type BuildOptions = {
  config: AppConfig;
  database: Database;
  tokenVerifier?: TokenVerifier;
  logger?: boolean | FastifyBaseLogger;
};

export function buildApp(options: BuildOptions) {
  const app = Fastify({
    logger: options.logger ?? { level: options.config.logLevel },
    bodyLimit: MAX_SAVE_SNAPSHOT_BYTES + 256 * 1024
  });
  void app.register(cors, {
    origin: options.config.frontendAllowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['authorization', 'content-type'],
    credentials: false,
    maxAge: 600
  });
  const verifyToken = options.tokenVerifier ?? createSupabaseTokenVerifier(options.config);
  const requireAuth = authenticate(verifyToken);

  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get(API_ROUTES.publicConfig.path, async () => ({
    environment: options.config.appEnv,
    expectedProjectRef: options.config.lornDevSupabaseProjectRef,
    supabaseUrl: options.config.supabaseUrl,
    publishableKey: options.config.supabasePublishableKey,
    apiBaseUrl: `http://${options.config.host}:${options.config.port}`,
    apiContractVersion: API_CONTRACT_VERSION,
    apiCapabilities: API_CAPABILITIES
  }));

  app.get('/health/ready', async (_request, reply) => {
    try {
      await checkDatabase(options.database);
      return { status: 'ready' };
    } catch (error) {
      app.log.warn({ err: error }, 'database readiness check failed');
      return reply.code(503).send({ status: 'not_ready' });
    }
  });

  app.get(API_ROUTES.accountRead.path, { preHandler: requireAuth }, async (request, reply) => {
    const account = await findAccountByAuthUserId(options.database, request.authUser!.id);
    if (!account) return reply.code(404).send({ error: { code: 'ACCOUNT_NOT_FOUND', message: 'Player account has not been created', requestId: request.id } });
    return { account };
  });

  app.post(API_ROUTES.accountInitialize.path, { preHandler: requireAuth }, async (request, reply) => {
    const result = await initializeAccountByAuthUserId(options.database, request.authUser!.id);
    return reply.code(result.created ? 201 : 200).send({ account: result.account });
  });

  app.get(API_ROUTES.saveRead.path, { preHandler: requireAuth }, async (request, reply) => {
    const save = await findGameSaveByAuthUserId(options.database, request.authUser!.id);
    if (!save) return reply.code(404).send({ error: { code: 'SAVE_NOT_FOUND', message: 'Cloud save has not been created', requestId: request.id } });
    return { save };
  });

  app.post(API_ROUTES.saveCommit.path, { preHandler: requireAuth }, async (request, reply) => {
    const input = saveCommitSchema.parse(request.body);
    const result = await commitGameSave(options.database, request.authUser!.id, input);
    return reply.code(!result.duplicate && result.save.revision === 1 ? 201 : 200).send(result);
  });

  app.post(API_ROUTES.leaseAcquire.path, { preHandler: requireAuth }, async (request) => acquirePlayLease(options.database, request.authUser!.id, leaseAcquireSchema.parse(request.body)));
  app.post(API_ROUTES.leaseRenew.path, { preHandler: requireAuth }, async (request) => renewPlayLease(options.database, request.authUser!.id, leaseIdentitySchema.parse(request.body)));
  app.post(API_ROUTES.leaseRelease.path, { preHandler: requireAuth }, async (request) => releasePlayLease(options.database, request.authUser!.id, leaseReleaseSchema.parse(request.body)));

  app.setErrorHandler((error, request, reply) => {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return void reply.code(413).send({ error: { code: 'SAVE_TOO_LARGE', message: 'Save request exceeds the accepted size', requestId: request.id } });
    }
    if (error instanceof SaveApiError) {
      return void reply.code(error.statusCode).send({ error: { code: error.code, message: error.message, requestId: request.id } });
    }
    if (error instanceof PlayLeaseError) {
      return void reply.code(error.statusCode).send({ error: { code: error.code, message: error.message, requestId: request.id } });
    }
    if (error instanceof ZodError) {
      return void reply.code(400).send({ error: { code: 'INVALID_SAVE_REQUEST', message: 'Save request format is invalid', requestId: request.id } });
    }
    request.log.error({ err: error, requestId: request.id, method: request.method, url: request.url }, 'request failed');
    void reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed', requestId: request.id } });
  });

  app.addHook('onClose', async () => options.database.close());
  return app;
}
