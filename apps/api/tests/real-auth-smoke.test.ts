import { describe, expect, it, vi } from 'vitest';
import { checkLocalApiReady, loadRealAuthSmokeConfig, runRealAuthSmoke } from '../src/real-auth-smoke.js';

const projectRef = 'lornprojectref';
const baseEnvironment = {
  APP_ENV: 'dev',
  HOST: '127.0.0.1',
  PORT: '3000',
  LORN_DEV_SUPABASE_PROJECT_REF: projectRef,
  SUPABASE_URL: `https://${projectRef}.supabase.co`,
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key'
};

function token(algorithm = 'ES256'): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: algorithm, kid: 'lorn-dev-key' })}.${encode({ sub: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })}.signature`;
}

function accountResponse() {
  return {
    account: {
      id: '11111111-1111-4111-8111-111111111111',
      authUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      status: 'active',
      dataVersion: 0,
      createdAt: '2026-10-17T00:00:00.000Z',
      updatedAt: '2026-10-17T00:00:00.000Z'
    }
  };
}

describe('real Supabase Auth smoke tool safety', () => {
  it('accepts only the pinned lorn-dev origin and a modern publishable key', () => {
    expect(loadRealAuthSmokeConfig(baseEnvironment)).toEqual({
      supabaseUrl: `https://${projectRef}.supabase.co`,
      publishableKey: 'sb_publishable_test_key',
      localApiUrl: 'http://127.0.0.1:3000'
    });
  });

  it.each([
    [{ ...baseEnvironment, APP_ENV: 'local' }, /APP_ENV=dev/],
    [{ ...baseEnvironment, SUPABASE_URL: 'https://anotherproject.supabase.co' }, /pinned lorn-dev/],
    [{ ...baseEnvironment, SUPABASE_PUBLISHABLE_KEY: ' secret ' }, /whitespace/],
    [{ ...baseEnvironment, SUPABASE_PUBLISHABLE_KEY: 'service_role_secret' }, /publishable key/],
    [{ ...baseEnvironment, HOST: 'api.example.com' }, /loopback/]
  ])('rejects unsafe configuration', (environment, expected) => {
    expect(() => loadRealAuthSmokeConfig(environment)).toThrow(expected);
  });

  it('checks local readiness without sending credentials', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ status: 'ready' }), { status: 200 }));
    await checkLocalApiReady(loadRealAuthSmokeConfig(baseEnvironment), fetcher as typeof fetch);
    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:3000/health/ready', expect.objectContaining({ method: 'GET', redirect: 'error' }));
  });

  it('logs in, requires ES256, and verifies stable account results through the local API', async () => {
    const responses = [
      new Response(JSON.stringify({ access_token: token(), user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } }), { status: 200 }),
      new Response(JSON.stringify(accountResponse()), { status: 201 }),
      new Response(JSON.stringify(accountResponse()), { status: 200 }),
      new Response(JSON.stringify(accountResponse()), { status: 200 })
    ];
    const requestedUrls: string[] = [];
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      requestedUrls.push(String(input));
      return responses.shift()!;
    });
    const result = await runRealAuthSmoke(
      loadRealAuthSmokeConfig(baseEnvironment),
      { email: 'player@example.com', password: 'not-logged' },
      fetcher as typeof fetch
    );

    expect(result).toEqual({
      tokenAlgorithm: 'ES256',
      firstInitializeStatus: 201,
      secondInitializeStatus: 200,
      accountLookupStatus: 200,
      accountId: '11111111-1111-4111-8111-111111111111'
    });
    expect(JSON.stringify(result)).not.toContain('not-logged');
    expect(requestedUrls).toEqual([
      `https://${projectRef}.supabase.co/auth/v1/token?grant_type=password`,
      'http://127.0.0.1:3000/v1/account/initialize',
      'http://127.0.0.1:3000/v1/account/initialize',
      'http://127.0.0.1:3000/v1/account'
    ]);
  });

  it('rejects a non-ES256 access token before calling the account API', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      access_token: token('HS256'), user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }
    }), { status: 200 }));
    await expect(runRealAuthSmoke(
      loadRealAuthSmokeConfig(baseEnvironment),
      { email: 'player@example.com', password: 'not-logged' },
      fetcher as typeof fetch
    )).rejects.toThrow(/Expected an ES256/);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
