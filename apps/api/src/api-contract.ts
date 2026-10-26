export const API_CONTRACT_VERSION = '20261022-account-api-v2';

export const API_ROUTES = {
  publicConfig: { method: 'GET', path: '/v1/config/public', auth: false },
  accountRead: { method: 'GET', path: '/v1/account', auth: true },
  accountInitialize: { method: 'POST', path: '/v1/account/initialize', auth: true },
  saveRead: { method: 'GET', path: '/v1/save', auth: true },
  saveCommit: { method: 'POST', path: '/v1/save/commit', auth: true },
  leaseAcquire: { method: 'POST', path: '/v1/play-lease/acquire', auth: true },
  leaseRenew: { method: 'POST', path: '/v1/play-lease/renew', auth: true },
  leaseRelease: { method: 'POST', path: '/v1/play-lease/release', auth: true }
} as const;

export const API_CAPABILITIES = Object.freeze(Object.values(API_ROUTES).map((route) => `${route.method} ${route.path}`));
