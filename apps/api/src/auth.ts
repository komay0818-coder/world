import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from './config.js';

export type AuthenticatedUser = { id: string; claims: JWTPayload };
export type TokenVerifier = (token: string) => Promise<AuthenticatedUser>;

export function createTokenVerifier(issuer: string, audience: string, jwks: JWTVerifyGetKey): TokenVerifier {
  return async (token) => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience
    });
    if (!payload.sub) throw new Error('Token has no subject');
    return { id: payload.sub, claims: payload };
  };
}

export function createSupabaseTokenVerifier(config: AppConfig): TokenVerifier {
  const issuer = `${config.supabaseUrl}/auth/v1`;
  return createTokenVerifier(issuer, config.supabaseJwtAudience, createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)));
}

export function authenticate(verifier: TokenVerifier) {
  return async function authHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      await reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'A valid access token is required', requestId: request.id } });
      return;
    }
    try {
      request.authUser = await verifier(header.slice(7));
    } catch {
      await reply.code(401).send({ error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired', requestId: request.id } });
    }
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthenticatedUser;
  }
}
