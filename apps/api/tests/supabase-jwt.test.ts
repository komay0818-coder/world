import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { createTokenVerifier, type TokenVerifier } from '../src/auth.js';

const issuer = 'https://dev-project.supabase.co/auth/v1';
const audience = 'authenticated';
let verifier: TokenVerifier;
let sign: (claims?: { issuer?: string; audience?: string; subject?: string; expiresIn?: string }) => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'dev-test-key';
  verifier = createTokenVerifier(issuer, audience, createLocalJWKSet({ keys: [publicJwk] }));
  sign = (claims = {}) => new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: 'dev-test-key' })
    .setIssuer(claims.issuer ?? issuer)
    .setAudience(claims.audience ?? audience)
    .setSubject(claims.subject ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    .setIssuedAt()
    .setExpirationTime(claims.expiresIn ?? '5m')
    .sign(privateKey);
});

describe('Supabase JWT verification policy', () => {
  it('accepts a correctly signed token and uses sub as the player identity', async () => {
    await expect(verifier(await sign())).resolves.toMatchObject({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
  });

  it('rejects a token from another issuer', async () => {
    await expect(verifier(await sign({ issuer: 'https://attacker.invalid/auth/v1' }))).rejects.toThrow();
  });

  it('rejects a token for another audience', async () => {
    await expect(verifier(await sign({ audience: 'other-service' }))).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    await expect(verifier(await sign({ expiresIn: '-1s' }))).rejects.toThrow();
  });

  it('rejects a token without a subject', async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = 'no-sub-key';
    const noSubVerifier = createTokenVerifier(issuer, audience, createLocalJWKSet({ keys: [publicJwk] }));
    const token = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'no-sub-key' })
      .setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(privateKey);
    await expect(noSubVerifier(token)).rejects.toThrow(/no subject/);
  });
});
