import { decodeProtectedHeader } from 'jose';
import { z } from 'zod';

export type RealAuthSmokeConfig = {
  supabaseUrl: string;
  publishableKey: string;
  localApiUrl: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RealAuthSmokeResult = {
  tokenAlgorithm: 'ES256';
  firstInitializeStatus: 201;
  secondInitializeStatus: 200;
  accountLookupStatus: 200;
  accountId: string;
};

type Fetch = typeof fetch;

const projectRefSchema = z.string().regex(/^[a-z0-9]+$/);
const accountSchema = z.object({
  id: z.string().uuid(),
  authUserId: z.string().uuid(),
  status: z.enum(['active', 'suspended', 'closed']),
  dataVersion: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
const accountResponseSchema = z.object({ account: accountSchema });
const loginResponseSchema = z.object({
  access_token: z.string().min(1),
  user: z.object({ id: z.string().uuid() })
});

function requiredExactValue(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name];
  if (!value) throw new Error(`${name} is required`);
  if (value !== value.trim() || /\s/.test(value)) throw new Error(`${name} contains whitespace`);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    throw new Error(`${name} must not be wrapped in quotes`);
  }
  return value;
}

export function loadRealAuthSmokeConfig(source: NodeJS.ProcessEnv = process.env): RealAuthSmokeConfig {
  if (source.APP_ENV !== 'dev') throw new Error('Real Auth smoke testing requires APP_ENV=dev');

  const expectedProjectRef = projectRefSchema.parse(requiredExactValue(source, 'LORN_DEV_SUPABASE_PROJECT_REF'));
  const supabaseUrlValue = requiredExactValue(source, 'SUPABASE_URL');
  const publishableKey = requiredExactValue(source, 'SUPABASE_PUBLISHABLE_KEY');
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY is not a modern Supabase publishable key');
  }

  const supabaseUrl = new URL(supabaseUrlValue);
  if (supabaseUrl.protocol !== 'https:' || supabaseUrl.username || supabaseUrl.password || supabaseUrl.port || supabaseUrl.pathname !== '/') {
    throw new Error('SUPABASE_URL must be the HTTPS origin of the lorn-dev project');
  }
  const expectedHost = `${expectedProjectRef}.supabase.co`;
  if (supabaseUrl.hostname.toLowerCase() !== expectedHost) {
    throw new Error('SUPABASE_URL does not match the pinned lorn-dev project ref');
  }

  const host = source.HOST?.trim() || '127.0.0.1';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('The Auth smoke tool only connects to a loopback API host');
  const port = z.coerce.number().int().min(1).max(65535).parse(source.PORT ?? '3000');
  const apiHost = host === '::1' ? '[::1]' : host;

  return {
    supabaseUrl: supabaseUrl.origin,
    publishableKey,
    localApiUrl: `http://${apiHost}:${port}`
  };
}

async function readJson(response: Response, label: string): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} returned invalid JSON`);
  }
}

export async function checkLocalApiReady(config: RealAuthSmokeConfig, fetcher: Fetch = fetch): Promise<void> {
  const response = await fetcher(`${config.localApiUrl}/health/ready`, {
    method: 'GET',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000)
  });
  if (response.status !== 200) throw new Error(`Local API readiness check failed with HTTP ${response.status}`);
  const body = z.object({ status: z.literal('ready') }).safeParse(await readJson(response, 'Local API readiness check'));
  if (!body.success) throw new Error('Local API readiness response was not valid');
}

async function signIn(config: RealAuthSmokeConfig, credentials: LoginCredentials, fetcher: Fetch): Promise<{ accessToken: string; userId: string }> {
  const email = credentials.email.trim();
  if (!z.string().email().safeParse(email).success) throw new Error('A valid test account email is required');
  if (!credentials.password) throw new Error('A test account password is required');

  const response = await fetcher(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ email, password: credentials.password }),
    redirect: 'error',
    signal: AbortSignal.timeout(20_000)
  });
  if (response.status !== 200) throw new Error(`Supabase login failed with HTTP ${response.status}`);
  const parsed = loginResponseSchema.safeParse(await readJson(response, 'Supabase login'));
  if (!parsed.success) throw new Error('Supabase login response was not valid');

  let header: ReturnType<typeof decodeProtectedHeader>;
  try {
    header = decodeProtectedHeader(parsed.data.access_token);
  } catch {
    throw new Error('Supabase returned an invalid access token');
  }
  if (header.alg !== 'ES256') throw new Error(`Expected an ES256 access token but received ${header.alg || 'an unspecified algorithm'}`);
  return { accessToken: parsed.data.access_token, userId: parsed.data.user.id };
}

async function requestAccount(config: RealAuthSmokeConfig, accessToken: string, method: 'GET' | 'POST', fetcher: Fetch): Promise<Response> {
  return fetcher(`${config.localApiUrl}/v1/account${method === 'POST' ? '/initialize' : ''}`, {
    method,
    headers: { authorization: `Bearer ${accessToken}` },
    redirect: 'error',
    signal: AbortSignal.timeout(20_000)
  });
}

export async function runRealAuthSmoke(config: RealAuthSmokeConfig, credentials: LoginCredentials, fetcher: Fetch = fetch): Promise<RealAuthSmokeResult> {
  const login = await signIn(config, credentials, fetcher);
  const first = await requestAccount(config, login.accessToken, 'POST', fetcher);
  const second = await requestAccount(config, login.accessToken, 'POST', fetcher);
  const lookup = await requestAccount(config, login.accessToken, 'GET', fetcher);

  if (first.status !== 201) throw new Error(`First account initialization returned HTTP ${first.status}, expected 201`);
  if (second.status !== 200) throw new Error(`Second account initialization returned HTTP ${second.status}, expected 200`);
  if (lookup.status !== 200) throw new Error(`Account lookup returned HTTP ${lookup.status}, expected 200`);

  const firstBody = accountResponseSchema.safeParse(await readJson(first, 'First account initialization'));
  const secondBody = accountResponseSchema.safeParse(await readJson(second, 'Second account initialization'));
  const lookupBody = accountResponseSchema.safeParse(await readJson(lookup, 'Account lookup'));
  if (!firstBody.success || !secondBody.success || !lookupBody.success) throw new Error('A local account response was not valid');

  const accounts = [firstBody.data.account, secondBody.data.account, lookupBody.data.account];
  if (new Set(accounts.map((account) => account.id)).size !== 1) throw new Error('Account IDs did not remain stable across initialization and lookup');
  if (accounts.some((account) => account.authUserId !== login.userId)) throw new Error('The initialized account did not match the authenticated Supabase user');

  return {
    tokenAlgorithm: 'ES256',
    firstInitializeStatus: 201,
    secondInitializeStatus: 200,
    accountLookupStatus: 200,
    accountId: accounts[0]!.id
  };
}
